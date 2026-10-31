"use server";

import { and, desc, eq } from "drizzle-orm";

import { db } from "../index";
import { medicalServices, serviceProviders, serviceTypes } from "../schemas";
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
      serviceProviderId: medicalServices.serviceProviderId,
      serviceTypeId: medicalServices.serviceTypeId,
      serviceProvider: serviceProviders.label,
      serviceType: serviceTypes.label,
      date: medicalServices.date,
      observation: medicalServices.observation,
      settlementStatus: medicalServices.settlementStatus,
      settlingDate: medicalServices.settlingDate,
      invoiceId: medicalServices.invoiceId,
      paymentAmount: medicalServices.paymentAmount,
      billingAmount: medicalServices.billingAmount,
      taxRate: medicalServices.taxRate,
      bank: medicalServices.bank,
      paymentMode: medicalServices.paymentMode,
      paymentReference: medicalServices.paymentReference,
    })
    .from(medicalServices)
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .orderBy(desc(medicalServices.date));
}

export async function createMedicalService(recordId: number, input: NewMedicalService) {
  await validateService(input.serviceProviderId, input.serviceTypeId);
  const [record] = await db
    .insert(medicalServices)
    .values({ ...input, medicalRecordId: recordId })
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
  const [record] = await db
    .update(medicalServices)
    .set(input)
    .where(eq(medicalServices.id, id))
    .returning();
  return record ?? null;
}

export async function updateSettlementMedicalService(id: number, values: Record<string, unknown>) {
  return updateMedicalService(id, {
    id,
    ...await getSettlementServiceInput(values, false),
  });
}

export async function deleteMedicalService(id: number) {
  const [record] = await db
    .delete(medicalServices)
    .where(eq(medicalServices.id, id))
    .returning();
  return record ?? null;
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

async function getServiceType(serviceTypeId: number) {
  const [serviceType] = await db
    .select()
    .from(serviceTypes)
    .where(eq(serviceTypes.id, serviceTypeId));
  if (!serviceType) throw new Error("Service type not found.");
  return serviceType;
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
