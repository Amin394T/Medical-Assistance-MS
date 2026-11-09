"use server";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "../index";
import {
  billingCashings,
  billingInvoices,
  insurancePolicies,
  insuranceProviders,
  medicalRecords,
  medicalServices,
  serviceProviders,
  serviceTypes,
} from "../schemas";
import type { MedicalService, NewMedicalService } from "../schemas";

export async function listRecordMedicalServices(recordId: number) {
  const rows = await db
    .select()
    .from(medicalServices)
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .where(eq(medicalServices.medicalRecordId, recordId));

  return rows.map(({ medical_services, service_providers, service_types }) => ({
    ...medical_services,
    serviceProvider: service_providers.label,
    serviceType: service_types.label,
  }));
}

export async function listServicesForSettlement() {
  return db
    .select({
      id: medicalServices.id,
      medicalRecordId: medicalServices.medicalRecordId,
      recordReference: medicalRecords.reference,
      accidentType: medicalRecords.accidentType,
      victimFirstName: medicalRecords.victimFirstName,
      victimLastName: medicalRecords.victimLastName,
      clientCompany: insurancePolicies.clientCompany,
      insuranceProvider: insuranceProviders.label,
      serviceProviderId: medicalServices.serviceProviderId,
      serviceTypeId: medicalServices.serviceTypeId,
      serviceProvider: serviceProviders.label,
      serviceType: serviceTypes.label,
      date: medicalServices.date,
      observation: medicalServices.observation,
      settlementStatus: medicalServices.settlementStatus,
      settlingDate: medicalServices.settlingDate,
      invoiceId: medicalServices.invoiceId,
      invoiceReference: billingInvoices.reference,
      paymentAmount: medicalServices.paymentAmount,
      billingAmount: medicalServices.billingAmount,
      taxRate: medicalServices.taxRate,
      bank: medicalServices.bank,
      paymentMode: medicalServices.paymentMode,
      paymentReference: medicalServices.paymentReference,
    })
    .from(medicalServices)
    .innerJoin(medicalRecords, eq(medicalServices.medicalRecordId, medicalRecords.id))
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id))
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .leftJoin(billingInvoices, eq(medicalServices.invoiceId, billingInvoices.id))
    .where(and(
      eq(medicalRecords.status, "PRG"),
      inArray(medicalServices.settlementStatus, ["WAIT", "BILL"]),
    ))
    .orderBy(desc(medicalServices.date));
}

export async function createMedicalService(recordId: number, input: NewMedicalService) {
  await validateService(input.serviceProviderId, input.serviceTypeId);
  await ensureRecordExists(recordId);
  await validateInvoiceForRecord(input.invoiceId ?? null, recordId);
  validateAmounts(input.paymentAmount, input.billingAmount, input.taxRate);
  const [record] = await db
    .insert(medicalServices)
    .values({
      ...input,
      medicalRecordId: recordId,
      settlementStatus: input.invoiceId ? "BILL" : "WAIT",
      settlingDate: null,
      invoiceId: input.invoiceId ?? null,
    })
    .returning();
  return record;
}

export async function createSettlementMedicalService(values: Record<string, unknown>) {
  const recordId = requiredId(values.medicalRecordId, "Medical record");
  const input = await getSettlementServiceInput(values, true);
  return createMedicalService(recordId, input);
}

export async function createRecordMedicalService(recordId: number, values: Record<string, unknown>) {
  const input = await getSettlementServiceInput(values, true);
  return createMedicalService(recordId, input);
}

export async function updateMedicalService(id: number, input: MedicalService) {
  await validateService(input.serviceProviderId, input.serviceTypeId);
  validateAmounts(input.paymentAmount, input.billingAmount, input.taxRate);
  const [existing] = await db
    .select()
    .from(medicalServices)
    .where(eq(medicalServices.id, id));
  if (!existing) return null;
  const invoiceId = input.invoiceId ?? null;
  await validateInvoiceForRecord(invoiceId, existing.medicalRecordId);
  if (existing.settlementStatus === "SETT" && invoiceId !== existing.invoiceId) {
    throw new Error("A settled medical service cannot be reassigned to an invoice.");
  }
  const invoiceTotalsNeedUpdate = existing.invoiceId !== invoiceId || existing.billingAmount !== input.billingAmount;
  const affectedInvoiceIds = [...new Set([existing.invoiceId, invoiceId].filter((value): value is number => value !== null))];
  if (invoiceTotalsNeedUpdate && affectedInvoiceIds.length) {
    const linkedCashings = await db
      .select({ cashed: billingCashings.cashed })
      .from(billingInvoices)
      .leftJoin(billingCashings, eq(billingInvoices.cashingId, billingCashings.id))
      .where(inArray(billingInvoices.id, affectedInvoiceIds));
    if (linkedCashings.some(({ cashed }) => cashed)) {
      throw new Error("A medical service linked to a cashed invoice cannot change its billing amount or invoice.");
    }
  }
  const settlementStatus = invoiceId
    ? existing.settlementStatus === "WAIT" ? "BILL" : existing.settlementStatus
    : existing.settlementStatus === "BILL" ? "WAIT" : existing.settlementStatus;
  return db.transaction((tx) => {
    const [record] = tx
      .update(medicalServices)
      .set({
        serviceProviderId: input.serviceProviderId,
        serviceTypeId: input.serviceTypeId,
        date: input.date,
        observation: input.observation,
        invoiceId,
        paymentAmount: input.paymentAmount,
        billingAmount: input.billingAmount,
        taxRate: input.taxRate,
        bank: input.bank,
        paymentMode: input.paymentMode,
        paymentReference: input.paymentReference,
        settlementStatus,
        settlingDate: existing.settlingDate,
      })
      .where(eq(medicalServices.id, id))
      .returning()
      .all();
    if (invoiceTotalsNeedUpdate) recalculateInvoiceTotals(tx, affectedInvoiceIds);
    return record ?? null;
  });
}

export async function updateSettlementMedicalService(id: number, values: Record<string, unknown>) {
  return updateMedicalService(id, {
    id,
    ...await getSettlementServiceInput(values, false),
  });
}

export async function deleteMedicalService(id: number) {
  const [existing] = await db
    .select()
    .from(medicalServices)
    .where(eq(medicalServices.id, id));
  if (!existing) return null;
  if (existing.invoiceId !== null) {
    const [invoice] = await db
      .select({ cashed: billingCashings.cashed })
      .from(billingInvoices)
      .leftJoin(billingCashings, eq(billingInvoices.cashingId, billingCashings.id))
      .where(eq(billingInvoices.id, existing.invoiceId));
    if (invoice?.cashed) throw new Error("A medical service linked to a cashed invoice cannot be deleted.");
  }
  return db.transaction((tx) => {
    const [record] = tx
      .delete(medicalServices)
      .where(eq(medicalServices.id, id))
      .returning()
      .all();
    if (existing.invoiceId !== null) recalculateInvoiceTotals(tx, [existing.invoiceId]);
    return record ?? null;
  });
}

function recalculateInvoiceTotals(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], invoiceIds: number[]) {
  for (const invoiceId of invoiceIds) {
    const services = tx
      .select({ billingAmount: medicalServices.billingAmount })
      .from(medicalServices)
      .where(eq(medicalServices.invoiceId, invoiceId))
      .all();
    const totalAmount = roundCurrency(services.reduce((total, service) => total + service.billingAmount, 0));
    tx.update(billingInvoices)
      .set({ totalAmount })
      .where(eq(billingInvoices.id, invoiceId))
      .run();

    const [invoice] = tx
      .select({ cashingId: billingInvoices.cashingId })
      .from(billingInvoices)
      .where(eq(billingInvoices.id, invoiceId))
      .all();
    if (invoice?.cashingId === null || invoice?.cashingId === undefined) continue;
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
}

async function getSettlementServiceInput(values: Record<string, unknown>, useTypeDefaults: boolean): Promise<Omit<MedicalService, "id">> {
  const serviceTypeId = requiredId(values.serviceTypeId, "Service type");
  const serviceType = await getServiceType(serviceTypeId);
  const paymentAmount = parseAmount(values.paymentAmount, "Payment amount", useTypeDefaults ? serviceType.paymentAmount : undefined);
  const billingAmount = parseAmount(values.billingAmount, "Billing amount", useTypeDefaults ? serviceType.billingAmount : undefined);
  const taxRate = parseAmount(values.taxRate, "Tax rate", useTypeDefaults ? serviceType.taxRate : undefined);
  const settlementStatus = values.settlementStatus ?? (useTypeDefaults ? "WAIT" : undefined);
  if (settlementStatus !== "WAIT" && settlementStatus !== "BILL" && settlementStatus !== "SETT") {
    throw new Error("Invalid settlement status.");
  }

  const paymentMode = values.paymentMode;
  if (paymentMode !== null && paymentMode !== undefined && paymentMode !== "" &&
    paymentMode !== "CHQ" && paymentMode !== "VRM" && paymentMode !== "CSH") {
    throw new Error("Invalid payment mode.");
  }

  return {
    serviceProviderId: requiredId(values.serviceProviderId, "Service provider"),
    serviceTypeId,
    date: optionalDate(values.date, "Service date"),
    observation: optionalString(values.observation),
    settlementStatus,
    settlingDate: optionalDate(values.settlingDate, "Settling date"),
    invoiceId: optionalId(values.invoiceId, "Invoice"),
    paymentAmount,
    billingAmount,
    taxRate,
    bank: optionalString(values.bank),
    paymentMode: paymentMode === "" || paymentMode == null ? null : paymentMode,
    paymentReference: optionalString(values.paymentReference),
  };
}

function requiredId(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}

function optionalId(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  return requiredId(value, label);
}

function parseAmount(value: unknown, label: string, defaultValue?: number) {
  if ((value === null || value === undefined || value === "") && defaultValue !== undefined) return defaultValue;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be a non-negative number.`);
  return number;
}

function optionalDate(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid.`);
  return date;
}

function optionalString(value: unknown) {
  return value == null || value === "" ? null : String(value);
}

function validateAmounts(paymentAmount: number, billingAmount: number, taxRate: number) {
  for (const [label, amount] of [
    ["Payment amount", paymentAmount],
    ["Billing amount", billingAmount],
    ["Tax rate", taxRate],
  ] as const) {
    if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} must be a non-negative number.`);
  }
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function getServiceType(serviceTypeId: number) {
  const [serviceType] = await db
    .select()
    .from(serviceTypes)
    .where(eq(serviceTypes.id, serviceTypeId));
  if (!serviceType) throw new Error("Service type not found.");
  return serviceType;
}

async function ensureRecordExists(recordId: number) {
  const [record] = await db
    .select({ id: medicalRecords.id })
    .from(medicalRecords)
    .where(eq(medicalRecords.id, recordId));
  if (!record) throw new Error("Medical record not found.");
}

async function validateInvoiceForRecord(invoiceId: number | null, recordId: number) {
  if (invoiceId === null) return;
  const [invoice] = await db
    .select({ id: billingInvoices.id })
    .from(billingInvoices)
    .where(and(
      eq(billingInvoices.id, invoiceId),
      eq(billingInvoices.medicalRecordId, recordId),
    ));
  if (!invoice) throw new Error("The selected invoice does not belong to this medical record.");
}

async function validateService(serviceProviderId: number, serviceTypeId: number) {
  const [result] = await db
    .select({ id: serviceTypes.id })
    .from(serviceProviders)
    .innerJoin(serviceTypes, eq(serviceProviders.profile, serviceTypes.targetProfile))
    .where(and(
      eq(serviceProviders.id, serviceProviderId),
      eq(serviceTypes.id, serviceTypeId),
    ))
    .limit(1);
  if (!result) throw new Error("Service provider and type mismatch.");
}
