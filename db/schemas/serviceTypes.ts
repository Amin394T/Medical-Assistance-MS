import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

export const serviceTypes = sqliteTable("service_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  paymentAmount: real("payment_amount").notNull(),
  billingAmount: real("billing_amount").notNull(),
  taxRate: real("tax_rate").notNull(),
  targetProfile: text("target_profile").notNull(),
});

export type ServiceType = typeof serviceTypes.$inferSelect;
export type NewServiceType = typeof serviceTypes.$inferInsert;