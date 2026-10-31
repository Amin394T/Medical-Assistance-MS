import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insurancePolicies } from "./insurancePolicies";

export const insurancePolicyStatuses = sqliteTable("insurance_policy_statuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id),
  status: text("status", { enum: ["VALID", "SSPD", "TRMN"] }).notNull(),
  effectiveDate: integer("effective_date", { mode: "timestamp" }).notNull(),
  updateDate: integer("update_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  cancelled: integer("cancelled", { mode: "boolean" }).default(false),
});

export type InsurancePolicyStatus = typeof insurancePolicyStatuses.$inferSelect;
export type NewInsurancePolicyStatus = typeof insurancePolicyStatuses.$inferInsert;
