"use server";

import { desc, eq } from "drizzle-orm";

import { db } from "../index";
import { insuranceProviders, invoices } from "../schemas";
import type { Invoice, NewInvoice } from "../schemas";

export async function listInvoices() {
  const rows = await db
    .select({
      id: invoices.id,
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

  return rows;
}

export async function createInvoice(input: NewInvoice) {
  const [record] = await db
    .insert(invoices)
    .values(input)
    .returning();
  return record;
}

export async function createInvoiceFromGrid(values: Record<string, unknown>) {
  return createInvoice(getInvoiceInput(values));
}

export async function updateInvoice(id: number, input: Invoice) {
  const [record] = await db
    .update(invoices)
    .set(input)
    .where(eq(invoices.id, id))
    .returning();
  return record ?? null;
}

export async function updateInvoiceFromGrid(id: number, values: Record<string, unknown>) {
  return updateInvoice(id, { id, ...getInvoiceInput(values) });
}

export async function deleteInvoice(id: number) {
  const [record] = await db
    .delete(invoices)
    .where(eq(invoices.id, id))
    .returning();
  return record ?? null;
}

function getInvoiceInput(values: Record<string, unknown>): Omit<Invoice, "id"> {
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
    insuranceProviderId: requiredNumber(values.insuranceProviderId, "Insurance provider"),
    bank: optionalString(values.bank),
    paymentMode: paymentMode === "" || paymentMode == null ? null : paymentMode,
    paymentReference: optionalString(values.paymentReference),
    cashed: values.cashed === true,
    cashingDate: optionalDate(values.cashingDate, "Cashing date"),
  };
}

function requiredNumber(value: unknown, label: string) {
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
