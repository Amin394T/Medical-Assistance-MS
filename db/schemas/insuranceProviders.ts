import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const insuranceProviders = sqliteTable("insurance_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  corporateId: text("corporate_id"),
  phone: text("phone"),
  email: text("email"),
});

export type InsuranceProvider = typeof insuranceProviders.$inferSelect;
export type NewInsuranceProvider = typeof insuranceProviders.$inferInsert;
