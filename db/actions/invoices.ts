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
    insuranceProviderId: invoice.insuranceProviderId,
    insuranceProvider: invoice.insuranceProvider,
    bank: invoice.bank,
    paymentMode: invoice.paymentMode,
    paymentReference: invoice.paymentReference,
    cashed: invoice.cashed,
    cashingDate: invoice.cashingDate,
  }));
}

export async function createInvoice(input: { medicalRecordId: number; medicalServiceIds: number[] }) {
  return createBillingInvoice(input.medicalRecordId, input.medicalServiceIds);
}

export async function createInvoiceFromGrid(values: Record<string, unknown>) {
  const medicalRecordId = requiredId(values.medicalRecordId ?? values.recordId, "Medical record");
  const serviceIds = values.medicalServiceIds ?? values.serviceIds;
  if (!Array.isArray(serviceIds)) throw new Error("Select the medical services to invoice.");
  return createBillingInvoice(medicalRecordId, serviceIds.map((id) => requiredId(id, "Medical service")));
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
