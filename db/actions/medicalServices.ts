"use server";

import { asc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "../index";
import { touchMedicalRecord } from "./medicalRecordAudit";
import { billingInvoices, invoiceSettlements, medicalRecords, medicalServices, serviceProviders, serviceTypes } from "../schemas";
import type { MedicalService } from "../schemas";

export async function listRecordMedicalServices(recordId: number) {
  const rows = await db.select({
    id: medicalServices.id,
    medicalRecordId: medicalServices.medicalRecordId,
    serviceProviderId: medicalServices.serviceProviderId,
    serviceTypeId: medicalServices.serviceTypeId,
    date: medicalServices.date,
    place: medicalServices.place,
    observation: medicalServices.observation,
    paymentAmount: medicalServices.paymentAmount,
    billingAmount: medicalServices.billingAmount,
    taxRate: medicalServices.taxRate,
    invoiceId: medicalServices.invoiceId,
    invoiceReference: sql<number | null>`billing_invoices.reference`,
    settlementId: medicalServices.settlementId,
    settlementSettled: invoiceSettlements.settled,
    serviceProvider: serviceProviders.label,
    serviceType: serviceTypes.label,
  }).from(medicalServices)
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .leftJoin(billingInvoices, eq(medicalServices.invoiceId, billingInvoices.id))
    .leftJoin(invoiceSettlements, eq(medicalServices.settlementId, invoiceSettlements.id))
    .where(eq(medicalServices.medicalRecordId, recordId))
    .orderBy(asc(medicalServices.date));
  return rows;
}

export async function createRecordMedicalService(recordId: number, values: Record<string, unknown>) {
  const serviceTypeId = requiredId(values.serviceTypeId, "Service type");
  const serviceProviderId = requiredId(values.serviceProviderId, "Service provider");
  const [type] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, serviceTypeId));
  if (!type) throw new Error("Service type not found.");
  await validateProvider(serviceProviderId, type.targetProfile);
  const [record] = await db.select({ id: medicalRecords.id }).from(medicalRecords).where(eq(medicalRecords.id, recordId));
  if (!record) throw new Error("Medical record not found.");
  const [created] = await db.insert(medicalServices).values({
    medicalRecordId: recordId,
    serviceTypeId,
    serviceProviderId,
    date: parseDate(values.date) ?? new Date(),
    place: optionalString(values.place),
    observation: optionalString(values.observation),
    paymentAmount: parseAmount(values.paymentAmount, type.paymentAmount, "Payment amount"),
    billingAmount: parseAmount(values.billingAmount, type.billingAmount, "Billing amount"),
    taxRate: parseAmount(values.taxRate, type.taxRate, "Tax rate"),
  }).returning();
  if (created) await db.transaction((tx) => touchMedicalRecord(tx, recordId));
  return created;
}

export async function updateMedicalService(id: number, input: MedicalService) {
  const [existing] = await db.select().from(medicalServices).where(eq(medicalServices.id, id));
  if (!existing) return null;
  const [type] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, input.serviceTypeId));
  if (!type) throw new Error("Service type not found.");
  await validateProvider(input.serviceProviderId, type.targetProfile);
  const [updated] = await db.update(medicalServices).set({
    serviceTypeId: input.serviceTypeId,
    serviceProviderId: input.serviceProviderId,
    date: input.date,
    place: input.place,
    observation: input.observation,
    paymentAmount: input.paymentAmount,
    billingAmount: input.billingAmount,
    taxRate: input.taxRate,
  }).where(eq(medicalServices.id, id)).returning();
  if (updated) await db.transaction((tx) => touchMedicalRecord(tx, existing.medicalRecordId));
  return updated ?? null;
}

export async function deleteMedicalService(id: number) {
  const [existing] = await db.select().from(medicalServices).where(eq(medicalServices.id, id));
  if (!existing) return null;
  if (existing.invoiceId !== null) throw new Error("Remove the service from its invoice before deleting it.");
  if (existing.settlementId !== null) throw new Error("Remove the service from its settlement before deleting it.");
  const [deleted] = await db.delete(medicalServices).where(eq(medicalServices.id, id)).returning();
  if (deleted) await db.transaction((tx) => touchMedicalRecord(tx, existing.medicalRecordId));
  return deleted ?? null;
}

async function validateProvider(id: number, profile: string) {
  const [provider] = await db.select({ profile: serviceProviders.profile }).from(serviceProviders)
    .where(eq(serviceProviders.id, id));
  if (!provider) throw new Error("Service provider not found.");
  if (provider.profile !== profile) throw new Error("Service provider and service type profiles do not match.");
}

function requiredId(value: unknown, label: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error(`${label} is required.`);
  return id;
}

function parseAmount(value: unknown, fallback: number, label: string) {
  const amount = value === undefined || value === null || value === "" ? fallback : Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} must be a non-negative number.`);
  return amount;
}

function parseDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Service date is invalid.");
  return date;
}

function optionalString(value: unknown) {
  return value == null || value === "" ? null : String(value);
}
