import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const insuranceProviders = sqliteTable("insurance_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  companyName: text("company_name"),
  companyId: text("company_id"),
  type: text("type", { enum: ["company", "agent", "broker"] }).notNull(),
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type InsuranceProvider = typeof insuranceProviders.$inferSelect;
export type NewInsuranceProvider = typeof insuranceProviders.$inferInsert;
