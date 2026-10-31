import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

export const insuranceProviders = sqliteTable("insurance_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  corporateId: text("corporate_id"),
  type: text("type", { enum: ["CMP", "AGT", "BRK", "SPC"] }).notNull(),
  phone: text("phone"),
  email: text("email"),
  balance: real("balance"),
});

export type InsuranceProvider = typeof insuranceProviders.$inferSelect;
export type NewInsuranceProvider = typeof insuranceProviders.$inferInsert;
