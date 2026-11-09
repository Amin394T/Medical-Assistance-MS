"use server";

import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";

import { db } from "../index";
import {
  billingCashings,
  billingInvoices,
  insurancePolicies,
  insuranceProviders,
  medicalRecords,
} from "../schemas";

type BillingCashingInput = {
  insuranceProviderId: number;
  invoiceIds: number[];
  bank?: string | null;
  paymentMode?: "CHQ" | "VRM" | "CSH" | null;
  paymentReference?: string | null;
  cashed?: boolean | null;
  cashingDate?: Date | null;
};

export async function listBillingCashings() {
  return db
    .select({
      id: billingCashings.id,
      insuranceProviderId: billingCashings.insuranceProviderId,
      insuranceProvider: insuranceProviders.label,
      requestDate: billingCashings.requestDate,
      totalAmount: billingCashings.totalAmount,
      bank: billingCashings.bank,
      paymentMode: billingCashings.paymentMode,
      paymentReference: billingCashings.paymentReference,
      cashed: billingCashings.cashed,
      cashingDate: billingCashings.cashingDate,
      invoiceCount: sql<number>`count(${billingInvoices.id})`.mapWith(Number),
    })
    .from(billingCashings)
    .innerJoin(insuranceProviders, eq(billingCashings.insuranceProviderId, insuranceProviders.id))
    .leftJoin(billingInvoices, eq(billingInvoices.cashingId, billingCashings.id))
    .groupBy(billingCashings.id)
    .orderBy(desc(billingCashings.requestDate));
}

export async function getBillingCashing(idValue: number) {
  const id = requiredId(idValue, "Billing cashing");
  const [cashing] = await db
    .select()
    .from(billingCashings)
    .where(eq(billingCashings.id, id));
  if (!cashing) return null;

  const invoices = await db
    .select({
      id: billingInvoices.id,
      reference: billingInvoices.reference,
      issueDate: billingInvoices.issueDate,
      totalAmount: billingInvoices.totalAmount,
      medicalRecordId: billingInvoices.medicalRecordId,
      medicalRecordReference: medicalRecords.reference,
    })
    .from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .where(eq(billingInvoices.cashingId, id))
    .orderBy(desc(billingInvoices.issueDate));

  return { ...cashing, invoices };
}

export async function createBillingCashing(input: BillingCashingInput) {
  const parsed = parseInput(input);
  return db.transaction((tx) => {
    const invoices = getInvoicesForCashing(tx, parsed.invoiceIds, parsed.insuranceProviderId);
    validateInvoicesNotCashed(tx, invoices);

    const totalAmount = roundCurrency(invoices.reduce((total, invoice) => total + invoice.totalAmount, 0));
    const [cashing] = tx
      .insert(billingCashings)
      .values({
        insuranceProviderId: parsed.insuranceProviderId,
        requestDate: new Date(),
        totalAmount,
        bank: parsed.bank,
        paymentMode: parsed.paymentMode,
        paymentReference: parsed.paymentReference,
        cashed: parsed.cashed,
        cashingDate: parsed.cashingDate,
      })
      .returning()
      .all();
    if (!cashing) throw new Error("The billing cashing could not be created.");

    releaseInvoicesFromOpenCashings(tx, invoices, null);
    tx.update(billingInvoices)
      .set({ cashingId: cashing.id })
      .where(inArray(billingInvoices.id, parsed.invoiceIds))
      .run();

    return cashing;
  });
}

export async function updateBillingCashing(idValue: number, input: BillingCashingInput) {
  const id = requiredId(idValue, "Billing cashing");
  const parsed = parseInput(input);
  return db.transaction((tx) => {
    const [current] = tx
      .select()
      .from(billingCashings)
      .where(eq(billingCashings.id, id))
      .all();
    if (!current) return null;
    if (current.cashed && !parsed.cashed) {
      throw new Error("A cashed billing request cannot be reopened.");
    }

    const invoices = getInvoicesForCashing(tx, parsed.invoiceIds, parsed.insuranceProviderId);
    validateInvoicesNotCashed(tx, invoices, id);
    const currentInvoiceIds = tx
      .select({ id: billingInvoices.id })
      .from(billingInvoices)
      .where(eq(billingInvoices.cashingId, id))
      .all()
      .map((invoice) => invoice.id);
    const selectedIds = new Set(parsed.invoiceIds);
    if (current.cashed && (
      currentInvoiceIds.length !== selectedIds.size ||
      currentInvoiceIds.some((invoiceId) => !selectedIds.has(invoiceId))
    )) {
      throw new Error("Invoices cannot be changed after a cashing has been marked as cashed.");
    }

    const totalAmount = roundCurrency(invoices.reduce((total, invoice) => total + invoice.totalAmount, 0));
    const [updated] = tx
      .update(billingCashings)
      .set({
        insuranceProviderId: parsed.insuranceProviderId,
        totalAmount,
        bank: parsed.bank,
        paymentMode: parsed.paymentMode,
        paymentReference: parsed.paymentReference,
        cashed: parsed.cashed,
        cashingDate: parsed.cashingDate,
      })
      .where(eq(billingCashings.id, id))
      .returning()
      .all();
    if (!updated) return null;

    releaseInvoicesFromOpenCashings(tx, invoices, id);
    tx.update(billingInvoices)
      .set({ cashingId: null })
      .where(and(eq(billingInvoices.cashingId, id), notInArray(billingInvoices.id, parsed.invoiceIds)))
      .run();
    tx.update(billingInvoices)
      .set({ cashingId: id })
      .where(inArray(billingInvoices.id, parsed.invoiceIds))
      .run();

    return updated;
  });
}

export async function deleteBillingCashing(idValue: number) {
  const id = requiredId(idValue, "Billing cashing");
  return db.transaction((tx) => {
    const [current] = tx
      .select()
      .from(billingCashings)
      .where(eq(billingCashings.id, id))
      .all();
    if (!current) return null;
    if (current.cashed) throw new Error("A cashed billing request cannot be deleted.");

    tx.update(billingInvoices)
      .set({ cashingId: null })
      .where(eq(billingInvoices.cashingId, id))
      .run();
    const [deleted] = tx
      .delete(billingCashings)
      .where(eq(billingCashings.id, id))
      .returning()
      .all();
    return deleted ?? null;
  });
}

function getInvoicesForCashing(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], invoiceIds: number[], insuranceProviderId: number) {
  const invoices = tx
    .select({
      id: billingInvoices.id,
      cashingId: billingInvoices.cashingId,
      totalAmount: billingInvoices.totalAmount,
      insuranceProviderId: insurancePolicies.insuranceCompanyId,
      cashingSettled: billingCashings.cashed,
    })
    .from(billingInvoices)
    .innerJoin(medicalRecords, eq(billingInvoices.medicalRecordId, medicalRecords.id))
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .leftJoin(billingCashings, eq(billingInvoices.cashingId, billingCashings.id))
    .where(inArray(billingInvoices.id, invoiceIds))
    .all();
  if (invoices.length !== invoiceIds.length) throw new Error("One or more billing invoices were not found.");
  if (invoices.some((invoice) => invoice.insuranceProviderId !== insuranceProviderId)) {
    throw new Error("All selected invoices must belong to the selected insurance provider.");
  }
  return invoices;
}

function validateInvoicesNotCashed(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  invoices: ReturnType<typeof getInvoicesForCashing>,
  ignoredCashingId?: number,
) {
  const cashingIds = [...new Set(
    invoices
      .map((invoice) => invoice.cashingId)
      .filter((id): id is number => id !== null && id !== ignoredCashingId),
  )];
  if (!cashingIds.length) return;
  const cashings = tx
    .select({ id: billingCashings.id, cashed: billingCashings.cashed })
    .from(billingCashings)
    .where(inArray(billingCashings.id, cashingIds))
    .all();
  if (cashings.some((cashing) => cashing.cashed)) {
    throw new Error("One or more selected invoices have already been cashed.");
  }
}

function releaseInvoicesFromOpenCashings(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  invoices: ReturnType<typeof getInvoicesForCashing>,
  keepCashingId: number | null,
) {
  const sourceIds = [...new Set(
    invoices
      .map((invoice) => invoice.cashingId)
      .filter((id): id is number => id !== null && id !== keepCashingId),
  )];
  for (const sourceId of sourceIds) {
    tx.update(billingInvoices)
      .set({ cashingId: null })
      .where(and(eq(billingInvoices.cashingId, sourceId), inArray(billingInvoices.id, invoices.map((invoice) => invoice.id))))
      .run();
    const remaining = tx
      .select({ totalAmount: billingInvoices.totalAmount })
      .from(billingInvoices)
      .where(eq(billingInvoices.cashingId, sourceId))
      .all();
    const totalAmount = roundCurrency(remaining.reduce((total, invoice) => total + invoice.totalAmount, 0));
    tx.update(billingCashings)
      .set({ totalAmount })
      .where(eq(billingCashings.id, sourceId))
      .run();
  }
}

function parseInput(input: BillingCashingInput) {
  const insuranceProviderId = requiredId(input.insuranceProviderId, "Insurance provider");
  const invoiceIds = uniqueIds(input.invoiceIds);
  const paymentMode = input.paymentMode ?? null;
  if (paymentMode !== null && paymentMode !== "CHQ" && paymentMode !== "VRM" && paymentMode !== "CSH") {
    throw new Error("Invalid payment mode.");
  }
  const cashingDate = optionalDate(input.cashingDate, "Cashing date");
  return {
    insuranceProviderId,
    invoiceIds,
    bank: optionalString(input.bank),
    paymentMode,
    paymentReference: optionalString(input.paymentReference),
    cashed: input.cashed === true,
    cashingDate,
  };
}

function requiredId(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}

function uniqueIds(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) throw new Error("Select at least one billing invoice.");
  const ids = value.map((invoiceId) => requiredId(invoiceId, "Billing invoice"));
  if (new Set(ids).size !== ids.length) throw new Error("A billing invoice can only be selected once.");
  return ids;
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

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
