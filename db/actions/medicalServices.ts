"use server";

import { eq, and, desc } from "drizzle-orm";

import { db } from "../index";
import { medicalServices, serviceProviders, serviceTypes } from "../schemas";
import type { NewMedicalService, MedicalService } from "../schemas";

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
  const rows = await db
    .select({
      id: medicalServices.id,
      medicalRecordId: medicalServices.medicalRecordId,
      serviceProviderId: medicalServices.serviceProviderId,
      serviceTypeId: medicalServices.serviceTypeId,
      serviceProvider: serviceProviders.label,
      serviceType: serviceTypes.label,
      serviceDate: medicalServices.serviceDate,
      feeAmount: medicalServices.feeAmount,
      billedAmount: medicalServices.billedAmount,
      taxRate: medicalServices.taxRate,
      billingStatus: medicalServices.billingStatus,
      settlingDate: medicalServices.settlingDate,
      bank: medicalServices.bank,
      paymentMode: medicalServices.paymentMode,
      paymentReference: medicalServices.paymentReference,
      invoiceId: medicalServices.invoiceId,
      observation: medicalServices.observation,
    })
    .from(medicalServices)
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .orderBy(desc(medicalServices.serviceDate));

  return rows;
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
  const recordId = requiredNumber(values.medicalRecordId, "Medical record");
  return createMedicalService(recordId, getSettlementServiceInput(values));
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
    ...getSettlementServiceInput(values),
  });
}

export async function deleteMedicalService(id: number) {
  const [record] = await db
    .delete(medicalServices)
    .where(eq(medicalServices.id, id))
    .returning();
  return record ?? null;
}

function getSettlementServiceInput(values: Record<string, unknown>): Omit<MedicalService, "id"> {
  const billingStatus = values.billingStatus;
  if (billingStatus !== "WTN" && billingStatus !== "BLD" && billingStatus !== "STL") {
    throw new Error("Invalid billing status.");
  }

  const paymentMode = values.paymentMode;
  if (paymentMode !== null && paymentMode !== undefined && paymentMode !== "" &&
    paymentMode !== "CHQ" && paymentMode !== "VRM" && paymentMode !== "CSH") {
    throw new Error("Invalid payment mode.");
  }

  return {
    serviceProviderId: requiredNumber(values.serviceProviderId, "Service provider"),
    serviceTypeId: requiredNumber(values.serviceTypeId, "Service type"),
    serviceDate: optionalDate(values.serviceDate, "Service date"),
    feeAmount: optionalNumber(values.feeAmount, "Fee amount") ?? 0,
    billedAmount: optionalNumber(values.billedAmount, "Billed amount"),
    taxRate: optionalNumber(values.taxRate, "Tax rate"),
    billingStatus,
    settlingDate: optionalDate(values.settlingDate, "Settling date"),
    bank: optionalString(values.bank),
    paymentMode: paymentMode === "" || paymentMode == null ? null : paymentMode,
    paymentReference: optionalString(values.paymentReference),
    invoiceId: optionalId(values.invoiceId, "Invoice"),
    observation: optionalString(values.observation),
  };
}

function requiredNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}

function optionalNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a number.`);
  return number;
}

function optionalId(value: unknown, label: string) {
  const number = optionalNumber(value, label);
  if (number !== null && (!Number.isInteger(number) || number < 1)) {
    throw new Error(`${label} must be a valid selection.`);
  }
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

async function validateService(serviceProviderId: number, serviceTypeId: number) {
  const [result] = await db
    .select()
    .from(serviceProviders)
    .innerJoin(serviceTypes, eq(serviceProviders.profile, serviceTypes.targetProfile))
    .where(and(
      eq(serviceProviders.id, serviceProviderId),
      eq(serviceTypes.id, serviceTypeId)
    ))
    .limit(1);
  if (!result) throw new Error("Service Provider And Type Mismatch");
}
