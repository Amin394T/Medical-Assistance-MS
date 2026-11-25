"use server";

import {
  createInvoiceCollection,
  deleteInvoiceCollection,
  getInvoiceCollection,
  listInvoiceCollections,
  updateInvoiceCollection,
} from "./invoiceCollections";
import { db } from "../index";
import { invoiceCollections } from "../schemas";
import { asc, isNotNull } from "drizzle-orm";

export async function listBillingCashings() {
  return listInvoiceCollections();
}

export async function getBillingCashing(id: number) {
  return getInvoiceCollection(id);
}

export async function listBillingCashingBanks() {
  const rows = await db.selectDistinct({ bank: invoiceCollections.bank }).from(invoiceCollections)
    .where(isNotNull(invoiceCollections.bank)).orderBy(asc(invoiceCollections.bank));
  return rows.flatMap(({ bank }) => bank?.trim() ? [bank.trim()] : []);
}

export async function createBillingCashing(input: {
  insuranceProviderId: number;
  invoiceIds: number[];
  bank?: string | null;
  paymentMode?: "CHQ" | "VRM" | "CSH" | null;
  paymentReference?: string | null;
  cashed?: boolean | null;
  cashingDate?: Date | null;
}) {
  return createInvoiceCollection({
    ...input,
    collected: input.cashed === true,
    collectionDate: input.cashingDate,
  });
}

export async function updateBillingCashing(id: number, input: Parameters<typeof createBillingCashing>[0]) {
  return updateInvoiceCollection(id, {
    ...input,
    collected: input.cashed === true,
    collectionDate: input.cashingDate,
  });
}

export async function deleteBillingCashing(id: number) {
  return deleteInvoiceCollection(id);
}
