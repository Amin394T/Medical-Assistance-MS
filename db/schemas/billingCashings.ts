import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const billingCashings = sqliteTable("billing_cashings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  insuranceProviderId: integer("insurance_provider_id").notNull().references(() => insuranceProviders.id),
  requestDate: integer("request_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  totalAmount: real("total_amount").notNull(),
  bank: text("bank"),
  paymentMode: text("payment_mode", { enum: ["CHQ", "VRM", "CSH"] }),
  paymentReference: text("payment_reference"),
  cashed: integer("cashed", { mode: "boolean" }).default(false),
  cashingDate: integer("cashing_date", { mode: "timestamp" }),
});

export type BillingCashing = typeof billingCashings.$inferSelect;
export type NewBillingCashing = typeof billingCashings.$inferInsert;
