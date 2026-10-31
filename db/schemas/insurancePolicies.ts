import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const insurancePolicies = sqliteTable("insurance_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull(),
  clientCompany: text("client_company").notNull(),
  effectiveDate: integer("effective_date", { mode: "timestamp" }).notNull(),
  insuranceCompanyId: integer("insurance_company_id").notNull().references(() => insuranceProviders.id),
  intermediaryId: integer("intermediary_id").references(() => insuranceProviders.id),
  type: text("type", { enum: ["REV", "FIX"] }).notNull(),
  creationDate: integer("creation_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastModified: integer("last_modified", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type NewInsurancePolicy = typeof insurancePolicies.$inferInsert;
