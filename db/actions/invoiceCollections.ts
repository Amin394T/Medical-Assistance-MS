"use server";

import { and, asc, desc, eq, gte, inArray, isNull, lte, count } from "drizzle-orm";

import { db } from "../index";
import {
  billingInvoices,
  insurancePolicies,
  insuranceProviders,
  invoiceCollections,
  medicalRecords,
} from "../schemas";

export async function listInvoiceCollections() {
  const rows = await db.select({
    id: invoiceCollections.id,
    reference: invoiceCollections.reference,
    insuranceProviderId: invoiceCollections.insuranceProviderId,
    insuranceProvider: insuranceProviders.label,
    requestDate: invoiceCollections.requestDate,
    totalAmount: invoiceCollections.totalAmount,
    paymentMode: invoiceCollections.paymentMode,
    paymentReference: invoiceCollections.paymentReference,
    bank: invoiceCollections.bank,
    collected: invoiceCollections.collected,
    collectionDate: invoiceCollections.collectionDate,
    invoiceCount: count(billingInvoices.id),
  }).from(invoiceCollections)
    .innerJoin(insuranceProviders, eq(invoiceCollections.insuranceProviderId, insuranceProviders.id))
    .leftJoin(billingInvoices, eq(billingInvoices.collectionId, invoiceCollections.id))
    .groupBy(invoiceCollections.id)
    .orderBy(desc(invoiceCollections.requestDate), asc(invoiceCollections.id));
  return rows.map((row) => ({ ...row, collected: Boolean(row.collected) }));
}

export async function getInvoiceCollection(id: number) {
  const [collection] = await db.select().from(invoiceCollections).where(eq(invoiceCollections.id, id));
  if (!collection) return null;
  const invoices = await db.select({
    id: billingInvoices.id,
    reference: billingInvoices.reference,
    issueDate: billingInvoices.issueDate,
    totalAmount: billingInvoices.totalAmount,
    medicalRecordId: billingInvoices.medicalRecordId,
    medicalRecordReference: medicalRecords.reference,
    medicalRecordType: medicalRecords.accidentType,
  }).from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .where(eq(billingInvoices.collectionId, id))
    .orderBy(desc(billingInvoices.issueDate));
  return { ...collection, collected: Boolean(collection.collected), invoices };
}

export async function listAvailableCollectionInvoices(collectionId?: number) {
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
  }).from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceProviderId, insuranceProviders.id))
    .where(collectionId === undefined
      ? isNull(billingInvoices.collectionId)
      : and(isNull(billingInvoices.collectionId), eq(billingInvoices.collectionId, collectionId)))
    .orderBy(desc(billingInvoices.issueDate));
}

type CollectionInput = {
  insuranceProviderId: number;
  invoiceIds: number[];
  totalAmount?: number;
  paymentMode?: "CHQ" | "VRM" | "CSH" | null;
  paymentReference?: string | null;
  bank?: string | null;
  collected?: boolean;
  collectionDate?: Date | null;
};

export async function createInvoiceCollection(input: CollectionInput) {
  const parsed = parseInput(input);
  return db.transaction((tx) => {
    const invoiceRows = getInvoices(tx, parsed.invoiceIds, parsed.insuranceProviderId);
    const totalAmount = roundCurrency(invoiceRows.reduce((total, row) => total + row.totalAmount, 0));
    const now = new Date();
    const reference = nextReference(tx, now);
    const [collection] = tx.insert(invoiceCollections).values({
      reference,
      insuranceProviderId: parsed.insuranceProviderId,
      requestDate: now,
      totalAmount,
      paymentMode: parsed.paymentMode,
      paymentReference: parsed.paymentReference,
      bank: parsed.bank,
      collected: parsed.collected,
      collectionDate: parsed.collectionDate,
    }).returning().all();
    if (!collection) throw new Error("The invoice collection could not be created.");
    tx.update(billingInvoices).set({ collectionId: collection.id }).where(inArray(billingInvoices.id, parsed.invoiceIds)).run();
    return collection;
  });
}

export async function updateInvoiceCollection(id: number, input: CollectionInput) {
  const parsed = parseInput(input);
  return db.transaction((tx) => {
    const [existing] = tx.select().from(invoiceCollections).where(eq(invoiceCollections.id, id)).all();
    if (!existing) return null;
    if (existing.collected && (!parsed.collected || existing.insuranceProviderId !== parsed.insuranceProviderId)) {
      throw new Error("A collected invoice collection cannot be reopened or reassigned.");
    }
    if (existing.collected) {
      const currentIds = tx.select({ id: billingInvoices.id }).from(billingInvoices).where(eq(billingInvoices.collectionId, id)).all().map(({ id: invoiceId }) => invoiceId);
      if (currentIds.length !== parsed.invoiceIds.length || currentIds.some((invoiceId) => !parsed.invoiceIds.includes(invoiceId))) {
        throw new Error("Invoices cannot be changed after collection is marked collected.");
      }
    }
    const invoices = getInvoices(tx, parsed.invoiceIds, parsed.insuranceProviderId, id);
    const [updated] = tx.update(invoiceCollections).set({
      insuranceProviderId: parsed.insuranceProviderId,
      totalAmount: roundCurrency(invoices.reduce((total, invoice) => total + invoice.totalAmount, 0)),
      paymentMode: parsed.paymentMode,
      paymentReference: parsed.paymentReference,
      bank: parsed.bank,
      collected: parsed.collected,
      collectionDate: parsed.collectionDate,
    }).where(eq(invoiceCollections.id, id)).returning().all();
    if (!updated) return null;
    tx.update(billingInvoices).set({ collectionId: null }).where(eq(billingInvoices.collectionId, id)).run();
    tx.update(billingInvoices).set({ collectionId: id }).where(inArray(billingInvoices.id, parsed.invoiceIds)).run();
    return updated;
  });
}

export async function deleteInvoiceCollection(id: number) {
  return db.transaction((tx) => {
    const [existing] = tx.select().from(invoiceCollections).where(eq(invoiceCollections.id, id)).all();
    if (!existing) return null;
    if (existing.collected) throw new Error("A collected invoice collection cannot be deleted.");
    tx.update(billingInvoices).set({ collectionId: null }).where(eq(billingInvoices.collectionId, id)).run();
    const [deleted] = tx.delete(invoiceCollections).where(eq(invoiceCollections.id, id)).returning().all();
    return deleted ?? null;
  });
}

function getInvoices(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], invoiceIds: number[], providerId: number, currentCollectionId?: number) {
  if (!invoiceIds.length || new Set(invoiceIds).size !== invoiceIds.length) throw new Error("Select at least one invoice.");
  const rows = tx.select({
    id: billingInvoices.id,
    totalAmount: billingInvoices.totalAmount,
    collectionId: billingInvoices.collectionId,
    providerId: insurancePolicies.insuranceProviderId,
  }).from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .where(inArray(billingInvoices.id, invoiceIds)).all();
  if (rows.length !== invoiceIds.length) throw new Error("One or more selected invoices were not found.");
  if (rows.some((invoice) => invoice.providerId !== providerId)) throw new Error("All invoices must belong to the selected insurance provider.");
  if (rows.some((invoice) => invoice.collectionId !== null && invoice.collectionId !== currentCollectionId)) {
    throw new Error("One or more invoices already belong to another collection.");
  }
  return rows;
}

function nextReference(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  const yearStart = Number(`${year}00000000`);
  const yearEnd = Number(`${year}99999999`);
  const references = tx.select({ reference: invoiceCollections.reference }).from(invoiceCollections)
    .where(and(gte(invoiceCollections.reference, yearStart), lte(invoiceCollections.reference, yearEnd))).all();
  const sequence = references.reduce((max, row) => Math.max(max, row.reference % 10_000), 0) + 1;
  if (sequence > 9999) throw new Error("The yearly invoice-collection reference limit has been reached.");
  return Number(`${year}${String(date.getMonth() + 1).padStart(2, "0")}${String(sequence).padStart(4, "0")}`);
}

function parseInput(input: CollectionInput) {
  const providerId = Number(input.insuranceProviderId);
  if (!Number.isInteger(providerId) || providerId < 1) throw new Error("Insurance provider is required.");
  if (!Array.isArray(input.invoiceIds)) throw new Error("Invoices must be selected.");
  if (input.paymentMode && !["CHQ", "VRM", "CSH"].includes(input.paymentMode)) throw new Error("Invalid payment mode.");
  if (input.collectionDate && Number.isNaN(input.collectionDate.getTime())) throw new Error("Collection date is invalid.");
  return {
    insuranceProviderId: providerId,
    invoiceIds: input.invoiceIds.map((id) => Number(id)),
    paymentMode: input.paymentMode ?? null,
    paymentReference: input.paymentReference?.trim() || null,
    bank: input.bank?.trim() || null,
    collected: input.collected === true,
    collectionDate: input.collectionDate ?? null,
  };
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
