import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const insuranceProviders = sqliteTable("insurance_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  corporateName: text("corporate_name"),
  corporateId: text("corporate_id"),
  type: text("type", { enum: ["CMP", "AGT", "BRK"] }).notNull(),
  phone: text("phone"),
  email: text("email"),
});

export type InsuranceProvider = typeof insuranceProviders.$inferSelect;
export type NewInsuranceProvider = typeof insuranceProviders.$inferInsert;
