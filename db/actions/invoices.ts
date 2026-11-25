"use server";

import {
  createBillingInvoice,
  deleteBillingInvoice,
  listBillingInvoices,
  updateBillingInvoice,
} from "./billingInvoices";

export async function listInvoices() {
  return (await listBillingInvoices()).map((invoice) => ({
    id: invoice.id,
    reference: invoice.reference,
    date: invoice.issueDate,
    totalAmount: invoice.totalAmount,
    medicalRecordId: invoice.medicalRecordId,
    medicalRecordReference: invoice.medicalRecordReference,
    accidentType: invoice.accidentType,
    collectionId: invoice.collectionId,
    collected: invoice.collected,
  }));
}

export async function createInvoice(input: { medicalRecordId: number; services: { id: number; paymentAmount: number; billingAmount: number; taxRate: number }[] }) {
  return createBillingInvoice(input.medicalRecordId, input.services);
}

export async function createInvoiceFromGrid(values: Record<string, unknown>) {
  const medicalRecordId = requiredId(values.medicalRecordId ?? values.recordId, "Medical record");
  const serviceRows = values.services;
  if (!Array.isArray(serviceRows)) throw new Error("Select the medical services to invoice.");
  const services = serviceRows.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Invalid medical service.");
    const row = entry as Record<string, unknown>;
    return {
      id: requiredId(row.id, "Medical service"),
      paymentAmount: Number(row.paymentAmount),
      billingAmount: Number(row.billingAmount),
      taxRate: Number(row.taxRate),
    };
  });
  return createBillingInvoice(medicalRecordId, services);
}

export async function updateInvoice(id: number, input: { totalAmount: number }) {
  return updateBillingInvoice(id, input.totalAmount);
}

export async function updateInvoiceFromGrid(id: number, values: Record<string, unknown>) {
  return updateBillingInvoice(id, Number(values.totalAmount));
}

export async function deleteInvoice(id: number) {
  return deleteBillingInvoice(id);
}

function requiredId(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}
