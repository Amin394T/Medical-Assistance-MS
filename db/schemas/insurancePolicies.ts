import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const insurancePolicies = sqliteTable("insurance_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull().unique(),
  clientCompany: text("client_company").notNull(),
  effectiveDate: integer("effective_date", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["VALI", "RESU", "SUSP", "TERM"] }).notNull(),
  insuranceCompanyId: integer("insurance_company_id").notNull().references(() => insuranceProviders.id),
  intermediaryId: integer("intermediary_id").references(() => insuranceProviders.id),
  creationDate: integer("creation_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type NewInsurancePolicy = typeof insurancePolicies.$inferInsert;
