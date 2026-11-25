import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { insurancePolicies } from "./insurancePolicies";

export const insuranceCoverages = sqliteTable("insurance_coverages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id, { onDelete: "cascade" }),
  employee: text("employee").notNull(),
}, (table) => [
  uniqueIndex("insurance_coverages_policy_employee_unique").on(table.policyId, table.employee),
]);

export type InsuranceCoverage = typeof insuranceCoverages.$inferSelect;
export type NewInsuranceCoverage = typeof insuranceCoverages.$inferInsert;
