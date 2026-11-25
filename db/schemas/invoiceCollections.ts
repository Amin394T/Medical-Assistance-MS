import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const invoiceCollections = sqliteTable("invoice_collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: integer("reference").notNull().unique(),
  insuranceProviderId: integer("insurance_provider_id").notNull().references(() => insuranceProviders.id),
  requestDate: integer("request_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  totalAmount: real("total_amount").notNull(),
  paymentMode: text("payment_mode", { enum: ["CHQ", "VRM", "CSH"] }),
  paymentReference: text("payment_reference"),
  bank: text("bank"),
  collected: integer("collected", { mode: "boolean" }).default(false),
  collectionDate: integer("collection_date", { mode: "timestamp" }),
});

export type InvoiceCollection = typeof invoiceCollections.$inferSelect;
export type NewInvoiceCollection = typeof invoiceCollections.$inferInsert;
