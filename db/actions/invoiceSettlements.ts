"use server";

import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import { db } from "../index";
import { invoiceSettlements, medicalRecords, medicalServices, serviceProviders, serviceTypes } from "../schemas";

export async function listInvoiceSettlements() {
  const rows = await db.select({
    id: invoiceSettlements.id,
    reference: invoiceSettlements.reference,
    serviceProviderId: invoiceSettlements.serviceProviderId,
    serviceProvider: serviceProviders.label,
    receptionDate: invoiceSettlements.receptionDate,
    totalAmount: invoiceSettlements.totalAmount,
    paymentMode: invoiceSettlements.paymentMode,
    paymentReference: invoiceSettlements.paymentReference,
    bank: invoiceSettlements.bank,
    settled: invoiceSettlements.settled,
    settlementDate: invoiceSettlements.settlementDate,
  }).from(invoiceSettlements)
    .innerJoin(serviceProviders, eq(invoiceSettlements.serviceProviderId, serviceProviders.id))
    .orderBy(desc(invoiceSettlements.receptionDate), asc(invoiceSettlements.id));
  return rows.map((row) => ({ ...row, settled: Boolean(row.settled) }));
}

export async function listSettlementServices(settlementId?: number) {
  const conditions = settlementId === undefined
    ? isNull(medicalServices.settlementId)
    : or(isNull(medicalServices.settlementId), eq(medicalServices.settlementId, settlementId));
  return db.select({
    id: medicalServices.id,
    medicalRecordId: medicalServices.medicalRecordId,
    recordReference: medicalRecords.reference,
    accidentType: medicalRecords.accidentType,
    serviceType: serviceTypes.label,
    serviceProviderId: medicalServices.serviceProviderId,
    serviceProvider: serviceProviders.label,
    date: medicalServices.date,
    paymentAmount: medicalServices.paymentAmount,
    billingAmount: medicalServices.billingAmount,
    taxRate: medicalServices.taxRate,
    settlementId: medicalServices.settlementId,
  }).from(medicalServices)
    .innerJoin(medicalRecords, eq(medicalServices.medicalRecordId, medicalRecords.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .where(conditions)
    .orderBy(asc(medicalServices.date));
}

export async function getInvoiceSettlement(id: number) {
  const [settlement] = await db.select().from(invoiceSettlements).where(eq(invoiceSettlements.id, id));
  if (!settlement) return null;
  const services = await db.select({
    id: medicalServices.id,
    medicalRecordId: medicalServices.medicalRecordId,
    recordReference: medicalRecords.reference,
    accidentType: medicalRecords.accidentType,
    serviceType: serviceTypes.label,
    serviceProviderId: medicalServices.serviceProviderId,
    serviceProvider: serviceProviders.label,
    date: medicalServices.date,
    paymentAmount: medicalServices.paymentAmount,
    billingAmount: medicalServices.billingAmount,
    taxRate: medicalServices.taxRate,
  }).from(medicalServices)
    .innerJoin(medicalRecords, eq(medicalServices.medicalRecordId, medicalRecords.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .where(eq(medicalServices.settlementId, id))
    .orderBy(asc(medicalServices.date));
  return { ...settlement, settled: Boolean(settlement.settled), services };
}

type SettlementInput = {
  serviceProviderId: number;
  serviceIds: number[];
  receptionDate?: Date | null;
  totalAmount?: number;
  paymentMode?: "CHQ" | "VRM" | "CSH" | null;
  paymentReference?: string | null;
  bank?: string | null;
  settled?: boolean;
  settlementDate?: Date | null;
};

export async function createInvoiceSettlement(input: SettlementInput) {
  const values = parseInput(input);
  return db.transaction((tx) => {
    const services = getServices(tx, values.serviceIds, values.serviceProviderId);
    const date = new Date();
    const reference = nextReference(tx, date);
    const [settlement] = tx.insert(invoiceSettlements).values({
      reference,
      serviceProviderId: values.serviceProviderId,
      receptionDate: values.receptionDate ?? date,
      totalAmount: roundCurrency(services.reduce((total, row) => total + row.paymentAmount, 0)),
      paymentMode: values.paymentMode,
      paymentReference: values.paymentReference,
      bank: values.bank,
      settled: values.settled,
      settlementDate: values.settlementDate,
    }).returning().all();
    if (!settlement) throw new Error("The invoice settlement could not be created.");
    tx.update(medicalServices).set({ settlementId: settlement.id }).where(inArray(medicalServices.id, values.serviceIds)).run();
    return settlement;
  });
}

export async function updateInvoiceSettlement(id: number, input: SettlementInput) {
  const values = parseInput(input);
  return db.transaction((tx) => {
    const [existing] = tx.select().from(invoiceSettlements).where(eq(invoiceSettlements.id, id)).all();
    if (!existing) return null;
    if (existing.settled && !values.settled) throw new Error("A settled invoice settlement cannot be reopened.");
    const currentIds = tx.select({ id: medicalServices.id }).from(medicalServices).where(eq(medicalServices.settlementId, id)).all().map(({ id: serviceId }) => serviceId);
    if (existing.settled && (currentIds.length !== values.serviceIds.length || currentIds.some((serviceId) => !values.serviceIds.includes(serviceId)))) {
      throw new Error("Services cannot be changed after settlement is marked settled.");
    }
    const services = getServices(tx, values.serviceIds, values.serviceProviderId, id);
    const [updated] = tx.update(invoiceSettlements).set({
      serviceProviderId: values.serviceProviderId,
      receptionDate: values.receptionDate,
      totalAmount: roundCurrency(services.reduce((total, row) => total + row.paymentAmount, 0)),
      paymentMode: values.paymentMode,
      paymentReference: values.paymentReference,
      bank: values.bank,
      settled: values.settled,
      settlementDate: values.settlementDate,
    }).where(eq(invoiceSettlements.id, id)).returning().all();
    if (!updated) return null;
    tx.update(medicalServices).set({ settlementId: null }).where(eq(medicalServices.settlementId, id)).run();
    tx.update(medicalServices).set({ settlementId: id }).where(inArray(medicalServices.id, values.serviceIds)).run();
    return updated;
  });
}

export async function deleteInvoiceSettlement(id: number) {
  return db.transaction((tx) => {
    const [existing] = tx.select().from(invoiceSettlements).where(eq(invoiceSettlements.id, id)).all();
    if (!existing) return null;
    if (existing.settled) throw new Error("A settled invoice settlement cannot be deleted.");
    tx.update(medicalServices).set({ settlementId: null }).where(eq(medicalServices.settlementId, id)).run();
    const [deleted] = tx.delete(invoiceSettlements).where(eq(invoiceSettlements.id, id)).returning().all();
    return deleted ?? null;
  });
}

function getServices(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], ids: number[], providerId: number, currentId?: number) {
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error("Select at least one service.");
  const rows = tx.select({
    id: medicalServices.id,
    paymentAmount: medicalServices.paymentAmount,
    settlementId: medicalServices.settlementId,
    providerId: medicalServices.serviceProviderId,
  }).from(medicalServices).where(inArray(medicalServices.id, ids)).all();
  if (rows.length !== ids.length) throw new Error("One or more selected services were not found.");
  if (rows.some((row) => row.providerId !== providerId)) throw new Error("All services must belong to the selected service provider.");
  if (rows.some((row) => row.settlementId !== null && row.settlementId !== currentId)) throw new Error("One or more services already belong to another settlement.");
  return rows;
}

function nextReference(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  const low = Number(`${year}00000000`);
  const high = Number(`${year}99999999`);
  const rows = tx.select({ reference: invoiceSettlements.reference }).from(invoiceSettlements)
    .where(and(gte(invoiceSettlements.reference, low), lte(invoiceSettlements.reference, high))).all();
  const sequence = rows.reduce((max, row) => Math.max(max, row.reference % 10_000), 0) + 1;
  if (sequence > 9999) throw new Error("The yearly invoice-settlement reference limit has been reached.");
  return Number(`${year}${String(date.getMonth() + 1).padStart(2, "0")}${String(sequence).padStart(4, "0")}`);
}

function parseInput(input: SettlementInput) {
  const serviceProviderId = Number(input.serviceProviderId);
  if (!Number.isInteger(serviceProviderId) || serviceProviderId < 1) throw new Error("Service provider is required.");
  if (!Array.isArray(input.serviceIds)) throw new Error("Services must be selected.");
  if (input.paymentMode && !["CHQ", "VRM", "CSH"].includes(input.paymentMode)) throw new Error("Invalid payment mode.");
  for (const [label, date] of [["Reception date", input.receptionDate], ["Settlement date", input.settlementDate]] as const) {
    if (date && Number.isNaN(date.getTime())) throw new Error(`${label} is invalid.`);
  }
  return {
    serviceProviderId,
    serviceIds: input.serviceIds.map(Number),
    receptionDate: input.receptionDate ?? null,
    paymentMode: input.paymentMode ?? null,
    paymentReference: input.paymentReference?.trim() || null,
    bank: input.bank?.trim() || null,
    settled: input.settled === true,
    settlementDate: input.settlementDate ?? null,
  };
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
