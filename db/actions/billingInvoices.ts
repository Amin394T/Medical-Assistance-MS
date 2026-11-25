"use server";

import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";

import { db } from "../index";
import {
  billingInvoices,
  insurancePolicies,
  insuranceProviders,
  invoiceCollections,
  medicalRecords,
  medicalServices,
  serviceProviders,
  serviceTypes,
} from "../schemas";

export async function listBillingInvoices() {
  const rows = await db.select({
    id: billingInvoices.id,
    reference: billingInvoices.reference,
    medicalRecordId: billingInvoices.medicalRecordId,
    medicalRecordReference: medicalRecords.reference,
    accidentType: medicalRecords.accidentType,
    issueDate: billingInvoices.issueDate,
    totalAmount: billingInvoices.totalAmount,
    collectionId: billingInvoices.collectionId,
    collectionReference: invoiceCollections.reference,
    collected: invoiceCollections.collected,
  })
    .from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .leftJoin(invoiceCollections, eq(billingInvoices.collectionId, invoiceCollections.id))
    .orderBy(desc(billingInvoices.issueDate));

  return rows.map((row) => ({ ...row, collected: Boolean(row.collected) }));
}

export async function listAvailableBillingInvoices(collectionId?: number) {
  const conditions = collectionId === undefined
    ? isNull(billingInvoices.collectionId)
    : and(isNull(billingInvoices.collectionId), eq(billingInvoices.collectionId, collectionId));
  return db.select({
    id: billingInvoices.id,
    medicalRecordId: billingInvoices.medicalRecordId,
    medicalRecordReference: medicalRecords.reference,
    medicalRecordType: medicalRecords.accidentType,
    reference: billingInvoices.reference,
    issueDate: billingInvoices.issueDate,
    totalAmount: billingInvoices.totalAmount,
    insuranceProviderId: insurancePolicies.insuranceProviderId,
    insuranceProvider: insuranceProviders.label,
    collectionId: billingInvoices.collectionId,
  })
    .from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceProviderId, insuranceProviders.id))
    .where(conditions)
    .orderBy(desc(billingInvoices.issueDate));
}

export async function listInvoiceCreationRecords() {
  return db.select({
    id: medicalRecords.id,
    reference: medicalRecords.reference,
    type: medicalRecords.accidentType,
    victimFirstName: medicalRecords.victimFirstName,
    victimLastName: medicalRecords.victimLastName,
  }).from(medicalRecords).orderBy(desc(medicalRecords.accidentDate));
}

export async function listUninvoicedServices(recordId: number) {
  return db.select({
    id: medicalServices.id,
    medicalRecordId: medicalServices.medicalRecordId,
    serviceType: serviceTypes.label,
    provider: serviceProviders.label,
    date: medicalServices.date,
    paymentAmount: medicalServices.paymentAmount,
    billingAmount: medicalServices.billingAmount,
    taxRate: medicalServices.taxRate,
  }).from(medicalServices)
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .where(and(eq(medicalServices.medicalRecordId, recordId), isNull(medicalServices.invoiceId)))
    .orderBy(asc(medicalServices.date));
}

export async function createBillingInvoice(
  medicalRecordIdValue: number,
  servicesValue: { id: number; paymentAmount: number; billingAmount: number; taxRate: number }[],
) {
  const medicalRecordId = requiredId(medicalRecordIdValue, "Medical record");
  if (!Array.isArray(servicesValue) || !servicesValue.length) throw new Error("Select at least one service to invoice.");
  const services = servicesValue.map((service) => ({
    id: requiredId(service.id, "Medical service"),
    paymentAmount: parseAmount(service.paymentAmount, "Payment amount"),
    billingAmount: parseAmount(service.billingAmount, "Billing amount"),
    taxRate: parseAmount(service.taxRate, "Tax rate"),
  }));
  if (new Set(services.map(({ id }) => id)).size !== services.length) throw new Error("A service can only be selected once.");

  return db.transaction((tx) => {
    const ids = services.map(({ id }) => id);
    const existing = tx.select({
      id: medicalServices.id,
      recordId: medicalServices.medicalRecordId,
      invoiceId: medicalServices.invoiceId,
    }).from(medicalServices).where(inArray(medicalServices.id, ids)).all();
    if (existing.length !== services.length) throw new Error("One or more selected services were not found.");
    if (existing.some((service) => service.recordId !== medicalRecordId || service.invoiceId !== null)) {
      throw new Error("Selected services must belong to this record and have no invoice.");
    }

    const issueDate = new Date();
    const year = String(issueDate.getFullYear()).slice(-2);
    const yearStart = Number(`${year}00000000`);
    const yearEnd = Number(`${year}99999999`);
    const references = tx.select({ reference: billingInvoices.reference }).from(billingInvoices)
      .where(and(gte(billingInvoices.reference, yearStart), lte(billingInvoices.reference, yearEnd))).all();
    const sequence = references.reduce((max, invoice) => Math.max(max, invoice.reference % 1_000_000), 0) + 1;
    if (sequence > 999_999) throw new Error("The yearly invoice reference limit has been reached.");
    const reference = Number(`${year}${String(issueDate.getMonth() + 1).padStart(2, "0")}${String(sequence).padStart(6, "0")}`);

    for (const service of services) {
      tx.update(medicalServices).set({
        paymentAmount: service.paymentAmount,
        billingAmount: service.billingAmount,
        taxRate: service.taxRate,
      }).where(eq(medicalServices.id, service.id)).run();
    }
    const totalAmount = roundCurrency(services.reduce((total, service) => total + service.billingAmount, 0));
    const [invoice] = tx.insert(billingInvoices).values({ medicalRecordId, reference, issueDate, totalAmount }).returning().all();
    if (!invoice) throw new Error("The invoice could not be created.");
    tx.update(medicalServices).set({ invoiceId: invoice.id }).where(inArray(medicalServices.id, ids)).run();
    return invoice;
  });
}

export async function createBillingInvoicesForServices(serviceIds: number[]) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) throw new Error("Select at least one service.");
  const rows = await db.select().from(medicalServices).where(inArray(medicalServices.id, serviceIds));
  const groups = new Map<number, typeof rows>();
  for (const row of rows) groups.set(row.medicalRecordId, [...(groups.get(row.medicalRecordId) ?? []), row]);
  if (groups.size !== 1) throw new Error("All selected services must belong to one medical record.");
  const recordId = [...groups.keys()][0];
  if (!recordId) throw new Error("Medical record is required.");
  return createBillingInvoice(recordId, rows.map(({ id, paymentAmount, billingAmount, taxRate }) => ({ id, paymentAmount, billingAmount, taxRate })));
}

export async function updateBillingInvoice(idValue: number, totalAmountValue: number) {
  const id = requiredId(idValue, "Invoice");
  const totalAmount = parseAmount(totalAmountValue, "Total amount");
  const [invoice] = await db.update(billingInvoices).set({ totalAmount }).where(eq(billingInvoices.id, id)).returning();
  return invoice ?? null;
}

export async function deleteBillingInvoice(idValue: number) {
  const id = requiredId(idValue, "Invoice");
  return db.transaction((tx) => {
    const [invoice] = tx.select().from(billingInvoices).where(eq(billingInvoices.id, id)).all();
    if (!invoice) return null;
    if (invoice.collectionId !== null) throw new Error("Remove the invoice from its collection before deleting it.");
    tx.update(medicalServices).set({ invoiceId: null }).where(eq(medicalServices.invoiceId, id)).run();
    const [deleted] = tx.delete(billingInvoices).where(eq(billingInvoices.id, id)).returning().all();
    return deleted ?? null;
  });
}

function requiredId(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}

function parseAmount(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be a non-negative number.`);
  return roundCurrency(number);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
