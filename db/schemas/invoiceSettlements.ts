import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

import { serviceProviders } from "./serviceProviders";

export const invoiceSettlements = sqliteTable("invoice_settlements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: integer("reference").notNull().unique(),
  serviceProviderId: integer("service_provider_id").notNull().references(() => serviceProviders.id),
  receptionDate: integer("reception_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  totalAmount: real("total_amount").notNull(),
  paymentMode: text("payment_mode", { enum: ["CHQ", "VRM", "CSH"] }),
  paymentReference: text("payment_reference"),
  bank: text("bank"),
  settled: integer("settled", { mode: "boolean" }).default(false),
  settlementDate: integer("settlement_date", { mode: "timestamp" }),
});

export type InvoiceSettlement = typeof invoiceSettlements.$inferSelect;
export type NewInvoiceSettlement = typeof invoiceSettlements.$inferInsert;
