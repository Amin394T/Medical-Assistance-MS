import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insuranceClients } from "./insuranceClients";
import { insuranceProviders } from "./insuranceProviders";

export const insurancePolicies = sqliteTable("insurance_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull(),
  clientCompanyId: integer("client_company_id").notNull().references(() => insuranceClients.id),
  effectiveDate: integer("effective_date", { mode: "timestamp_ms" }),
  insuranceCompanyId: integer("insurance_company_id").notNull().references(() => insuranceProviders.id),
  intermediateId: integer("intermediate_id").references(() => insuranceProviders.id),
  terminated: integer("terminated", { mode: "boolean" }).notNull().default(false),
  terminationDate: integer("termination_date", { mode: "timestamp_ms" }),
  type: text("type", { enum: ["revisable", "fixed-rate"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type NewInsurancePolicy = typeof insurancePolicies.$inferInsert;
