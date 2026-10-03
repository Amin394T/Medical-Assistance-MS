import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const insurancePolicies = sqliteTable("insurance_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull(),
  clientCompany: text("client_company").notNull(),
  effectiveDate: integer("effective_date", { mode: "timestamp" }).notNull(),
  insuranceCompanyId: integer("insurance_company_id").notNull().references(() => insuranceProviders.id),
  intermediaryId: integer("intermediary_id").references(() => insuranceProviders.id),
  terminated: integer("terminated", { mode: "boolean" }).default(false),
  terminationDate: integer("termination_date", { mode: "timestamp" }),
  type: text("type", { enum: ["REV", "FIX"] }).notNull(),
  nominativeList: text("nominative_list"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type InsurancePolicy = Omit<typeof insurancePolicies.$inferSelect, "createdAt" | "updatedAt">;
export type NewInsurancePolicy = Omit<typeof insurancePolicies.$inferInsert, "createdAt" | "updatedAt">;
