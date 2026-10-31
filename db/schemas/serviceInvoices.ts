import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: integer("reference").notNull().unique(),
  date: integer("date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  totalAmount: real("total_amount").notNull(),
  insuranceProviderId: integer("insurance_provider_id").notNull().references(() => insuranceProviders.id),
  bank: text("bank"),
  paymentMode: text("payment_mode", { enum: ["CHQ", "VRM", "CSH"] }),
  paymentReference: text("payment_reference"),
  cashed: integer("cashed", { mode: "boolean" }).default(false),
  cashingDate: integer("cashing_date", { mode: "timestamp" }),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
