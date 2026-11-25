import { sqliteTable, integer, real, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { insuranceProviders } from "./insuranceProviders";

export const insuranceCommissions = sqliteTable("insurance_commissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: integer("provider_id").notNull().references(() => insuranceProviders.id),
  recordType: text("record_type", { enum: ["AT", "MD", "VP", "SS", "MP"] }).notNull(),
  commission: real("commission").notNull(),
}, (table) => [
  uniqueIndex("insurance_commissions_provider_record_type_unique").on(table.providerId, table.recordType),
]);

export type InsuranceCommission = typeof insuranceCommissions.$inferSelect;
export type NewInsuranceCommission = typeof insuranceCommissions.$inferInsert;
