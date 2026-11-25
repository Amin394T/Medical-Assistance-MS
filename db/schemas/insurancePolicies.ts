import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const insurancePolicies = sqliteTable("insurance_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull().unique(),
  clientCompany: text("client_company").notNull(),
  clientActivity: text("client_activity"),
  clientAddress: text("client_address"),
  clientCity: text("client_city"),
  type: text("type", { enum: ["GLB", "NMT"] }).notNull(),
  status: text("status", { enum: ["VLD", "SPD", "TRM"] }).notNull(),
  statusDate: integer("status_date", { mode: "timestamp" }).notNull(),
  uploadDate: integer("upload_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  insuranceProviderId: integer("insurance_provider_id").notNull().references(() => insuranceProviders.id),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type NewInsurancePolicy = typeof insurancePolicies.$inferInsert;
