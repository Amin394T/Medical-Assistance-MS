"use server";

import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "../index";
import { insuranceProviders, invoices } from "../schemas";
import type { Invoice, NewInvoice } from "../schemas";

type NewInvoiceInput = Omit<NewInvoice, "reference">;

export async function listInvoices() {
  return db
    .select({
      id: invoices.id,
      reference: invoices.reference,
      date: invoices.date,
      totalAmount: invoices.totalAmount,
      insuranceProviderId: invoices.insuranceProviderId,
      insuranceProvider: insuranceProviders.label,
      bank: invoices.bank,
      paymentMode: invoices.paymentMode,
      paymentReference: invoices.paymentReference,
      cashed: invoices.cashed,
      cashingDate: invoices.cashingDate,
    })
    .from(invoices)
    .innerJoin(insuranceProviders, eq(invoices.insuranceProviderId, insuranceProviders.id))
    .orderBy(desc(invoices.date));
}

export async function createInvoice(input: NewInvoiceInput) {
  return db.transaction((tx) => {
    const now = input.date ?? new Date();
    const year = String(now.getFullYear()).slice(-2);
    const yearStart = Number(`${year}00000000`);
    const yearEnd = Number(`${year}99999999`);
    const references = tx
      .select({ reference: invoices.reference })
      .from(invoices)
      .where(and(gte(invoices.reference, yearStart), lte(invoices.reference, yearEnd)))
      .all();
    const lastSequence = references.reduce((max, { reference }) => Math.max(max, reference % 1_000_000), 0);
    const sequence = lastSequence + 1;
    if (sequence > 999_999) throw new Error("The yearly invoice reference limit has been reached.");
    const reference = Number(`${year}${String(now.getMonth() + 1).padStart(2, "0")}${String(sequence).padStart(6, "0")}`);

    const [record] = tx
      .insert(invoices)
      .values({ ...input, reference, date: now })
      .returning()
      .all();
    return record;
  });
}

export async function createInvoiceFromGrid(values: Record<string, unknown>) {
  return createInvoice(getInvoiceInput(values));
}

export async function updateInvoice(id: number, input: Invoice) {
  const [record] = await db
    .update(invoices)
    .set({
      totalAmount: input.totalAmount,
      insuranceProviderId: input.insuranceProviderId,
      bank: input.bank,
      paymentMode: input.paymentMode,
      paymentReference: input.paymentReference,
      cashed: input.cashed,
      cashingDate: input.cashingDate,
    })
    .where(eq(invoices.id, id))
    .returning();
  return record ?? null;
}

export async function updateInvoiceFromGrid(id: number, values: Record<string, unknown>) {
  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!existing) return null;
  return updateInvoice(id, { ...existing, ...getInvoiceInput(values), reference: existing.reference });
}

export async function deleteInvoice(id: number) {
  const [record] = await db
    .delete(invoices)
    .where(eq(invoices.id, id))
    .returning();
  return record ?? null;
}

function getInvoiceInput(values: Record<string, unknown>): NewInvoiceInput {
  const paymentMode = values.paymentMode;
  if (paymentMode !== null && paymentMode !== undefined && paymentMode !== "" &&
    paymentMode !== "CHQ" && paymentMode !== "VRM" && paymentMode !== "CSH") {
    throw new Error("Invalid payment mode.");
  }

  const date = optionalDate(values.date, "Invoice date") ?? new Date();
  const totalAmount = Number(values.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    throw new Error("Total amount must be a non-negative number.");
  }

  return {
    date,
    totalAmount,
    insuranceProviderId: requiredId(values.insuranceProviderId, "Insurance provider"),
    bank: optionalString(values.bank),
    paymentMode: paymentMode === "" || paymentMode == null ? null : paymentMode,
    paymentReference: optionalString(values.paymentReference),
    cashed: values.cashed === true,
    cashingDate: optionalDate(values.cashingDate, "Cashing date"),
  };
}

function requiredId(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
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
