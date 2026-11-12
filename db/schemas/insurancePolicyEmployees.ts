import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { insurancePolicies } from "./insurancePolicies";

export const insurancePolicyEmployees = sqliteTable("insurance_policy_employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id, { onDelete: "cascade" }),
  employee: text("employee").notNull(),
}, (table) => [
  uniqueIndex("insurance_policy_employees_policy_employee_unique").on(table.policyId, table.employee),
]);

export type InsurancePolicyEmployee = typeof insurancePolicyEmployees.$inferSelect;
export type NewInsurancePolicyEmployee = typeof insurancePolicyEmployees.$inferInsert;
