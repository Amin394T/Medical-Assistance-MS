"use server";

import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import { db } from "../index";
import {
  billingCashings,
  billingInvoices,
  insurancePolicies,
  insuranceProviders,
  medicalRecords,
  medicalServices,
} from "../schemas";

export async function listBillingInvoices() {
  const rows = await db
    .select({
      id: billingInvoices.id,
      medicalRecordId: billingInvoices.medicalRecordId,
      medicalRecordReference: medicalRecords.reference,
      reference: billingInvoices.reference,
      issueDate: billingInvoices.issueDate,
      totalAmount: billingInvoices.totalAmount,
      cashingId: billingInvoices.cashingId,
      insuranceProviderId: insurancePolicies.insuranceCompanyId,
      insuranceProvider: insuranceProviders.label,
      bank: billingCashings.bank,
      paymentMode: billingCashings.paymentMode,
      paymentReference: billingCashings.paymentReference,
      cashed: billingCashings.cashed,
      cashingDate: billingCashings.cashingDate,
    })
    .from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id))
    .leftJoin(billingCashings, eq(billingInvoices.cashingId, billingCashings.id))
    .orderBy(desc(billingInvoices.issueDate));

  return rows.map((row) => ({ ...row, cashed: Boolean(row.cashed) }));
}

export async function listAvailableBillingInvoices(cashingId?: number) {
  const selectedCashingId = cashingId === undefined ? undefined : requiredId(cashingId, "Billing cashing");
  const condition = selectedCashingId
    ? or(isNull(billingInvoices.cashingId), eq(billingInvoices.cashingId, selectedCashingId))
    : or(isNull(billingInvoices.cashingId), eq(billingCashings.cashed, false));
  return db
    .select({
      id: billingInvoices.id,
      medicalRecordId: billingInvoices.medicalRecordId,
      medicalRecordReference: medicalRecords.reference,
      reference: billingInvoices.reference,
      issueDate: billingInvoices.issueDate,
      totalAmount: billingInvoices.totalAmount,
      insuranceProviderId: insurancePolicies.insuranceCompanyId,
      insuranceProvider: insuranceProviders.label,
      cashingId: billingInvoices.cashingId,
      cashingSettled: billingCashings.cashed,
    })
    .from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id))
    .leftJoin(billingCashings, eq(billingInvoices.cashingId, billingCashings.id))
    .where(condition)
    .orderBy(desc(billingInvoices.issueDate));
}

export async function createBillingInvoice(medicalRecordIdValue: number, medicalServiceIdsValue: number[]) {
  const medicalRecordId = requiredId(medicalRecordIdValue, "Medical record");
  const medicalServiceIds = uniqueIds(medicalServiceIdsValue, "Medical service");

  return db.transaction((tx) => createInvoiceForRecord(tx, medicalRecordId, medicalServiceIds, new Date()));
}

export async function createBillingInvoicesForServices(medicalServiceIdsValue: number[]) {
  const medicalServiceIds = uniqueIds(medicalServiceIdsValue, "Medical service");
  return db.transaction((tx) => {
    const services = tx
      .select({
        id: medicalServices.id,
        recordId: medicalServices.medicalRecordId,
      })
      .from(medicalServices)
      .where(inArray(medicalServices.id, medicalServiceIds))
      .all();
    if (services.length !== medicalServiceIds.length) throw new Error("One or more medical services were not found.");

    const servicesByRecord = new Map<number, number[]>();
    for (const service of services) {
      const ids = servicesByRecord.get(service.recordId) ?? [];
      ids.push(service.id);
      servicesByRecord.set(service.recordId, ids);
    }

    const issueDate = new Date();
    const created = [];
    for (const [recordId, serviceIds] of servicesByRecord) {
      created.push(createInvoiceForRecord(tx, recordId, serviceIds, issueDate));
    }
    return created;
  });
}

export async function updateBillingInvoice(idValue: number, totalAmountValue: number) {
  const id = requiredId(idValue, "Billing invoice");
  const totalAmount = parseAmount(totalAmountValue, "Total amount");
  return db.transaction((tx) => {
    const [existing] = tx
      .select()
      .from(billingInvoices)
      .where(eq(billingInvoices.id, id))
      .all();
    if (!existing) return null;

    if (existing.cashingId !== null) {
      const [cashing] = tx
        .select({ cashed: billingCashings.cashed })
        .from(billingCashings)
        .where(eq(billingCashings.id, existing.cashingId))
        .all();
      if (cashing?.cashed) throw new Error("An invoice cannot be changed after its cashing is marked as cashed.");
    }

    const [invoice] = tx
      .update(billingInvoices)
      .set({ totalAmount })
      .where(eq(billingInvoices.id, id))
      .returning()
      .all();
    if (invoice?.cashingId !== null && invoice?.cashingId !== undefined) {
      const cashingInvoices = tx
        .select({ totalAmount: billingInvoices.totalAmount })
        .from(billingInvoices)
        .where(eq(billingInvoices.cashingId, invoice.cashingId))
        .all();
      const cashingTotal = roundCurrency(cashingInvoices.reduce((total, item) => total + item.totalAmount, 0));
      tx.update(billingCashings)
        .set({ totalAmount: cashingTotal })
        .where(eq(billingCashings.id, invoice.cashingId))
        .run();
    }
    return invoice ?? null;
  });
}

export async function deleteBillingInvoice(idValue: number) {
  const id = requiredId(idValue, "Billing invoice");
  return db.transaction((tx) => {
    const [invoice] = tx
      .select()
      .from(billingInvoices)
      .where(eq(billingInvoices.id, id))
      .all();
    if (!invoice) return null;
    if (invoice.cashingId !== null) throw new Error("Remove this invoice from its cashing before deleting it.");
    const linkedServices = tx
      .select({ settlementStatus: medicalServices.settlementStatus })
      .from(medicalServices)
      .where(eq(medicalServices.invoiceId, id))
      .all();
    if (linkedServices.some((service) => service.settlementStatus === "SETT")) {
      throw new Error("An invoice containing settled services cannot be deleted.");
    }

    tx.update(medicalServices)
      .set({ invoiceId: null, settlementStatus: "WAIT" })
      .where(eq(medicalServices.invoiceId, id))
      .run();

    const [deleted] = tx
      .delete(billingInvoices)
      .where(eq(billingInvoices.id, id))
      .returning()
      .all();
    return deleted ?? null;
  });
}

function requiredId(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}

function uniqueIds(values: unknown, label: string) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`Select at least one ${label.toLowerCase()}.`);
  const ids = values.map((value) => requiredId(value, label));
  if (new Set(ids).size !== ids.length) throw new Error(`A ${label.toLowerCase()} can only be selected once.`);
  return ids;
}

function parseAmount(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be a non-negative number.`);
  return roundCurrency(number);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function createInvoiceForRecord(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  medicalRecordId: number,
  medicalServiceIds: number[],
  issueDate: Date,
) {
  const [record] = tx
    .select({ id: medicalRecords.id, status: medicalRecords.status })
    .from(medicalRecords)
    .where(eq(medicalRecords.id, medicalRecordId))
    .all();
  if (!record) throw new Error("Medical record not found.");
  if (record.status !== "PRG") throw new Error("Only in-progress medical records can be invoiced.");

  const services = tx
    .select({
      id: medicalServices.id,
      recordId: medicalServices.medicalRecordId,
      settlementStatus: medicalServices.settlementStatus,
      invoiceId: medicalServices.invoiceId,
      billingAmount: medicalServices.billingAmount,
    })
    .from(medicalServices)
    .where(inArray(medicalServices.id, medicalServiceIds))
    .all();
  if (services.length !== medicalServiceIds.length) throw new Error("One or more medical services were not found.");
  if (services.some((service) => service.recordId !== medicalRecordId)) {
    throw new Error("All selected medical services must belong to the same medical record.");
  }
  if (services.some((service) => service.settlementStatus !== "WAIT" || service.invoiceId !== null)) {
    throw new Error("Only waiting, uninvoiced medical services can be added to a new invoice.");
  }

  const totalAmount = roundCurrency(services.reduce((total, service) => total + service.billingAmount, 0));
  const year = String(issueDate.getFullYear()).slice(-2);
  const yearStart = Number(`${year}00000000`);
  const yearEnd = Number(`${year}99999999`);
  const references = tx
    .select({ reference: billingInvoices.reference })
    .from(billingInvoices)
    .where(and(gte(billingInvoices.reference, yearStart), lte(billingInvoices.reference, yearEnd)))
    .all();
  const sequence = references.reduce((max, invoice) => Math.max(max, invoice.reference % 1_000_000), 0) + 1;
  if (sequence > 999_999) throw new Error("The yearly billing-invoice reference limit has been reached.");
  const reference = Number(`${year}${String(issueDate.getMonth() + 1).padStart(2, "0")}${String(sequence).padStart(6, "0")}`);

  const [invoice] = tx
    .insert(billingInvoices)
    .values({ medicalRecordId, reference, issueDate, totalAmount })
    .returning()
    .all();
  if (!invoice) throw new Error("The billing invoice could not be created.");

  tx.update(medicalServices)
    .set({ invoiceId: invoice.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, medicalServiceIds))
    .run();
  return invoice;
}
