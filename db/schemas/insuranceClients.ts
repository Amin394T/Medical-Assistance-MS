import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const insuranceClients = sqliteTable("insurance_clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  name: text("name"),
  sector: text("sector"),
  phone: text("phone").notNull(),
  fax: text("fax"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type InsuranceClient = typeof insuranceClients.$inferSelect;
export type NewInsuranceClient = typeof insuranceClients.$inferInsert;
