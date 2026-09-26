import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const serviceTypes = sqliteTable("service_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  targetProfile: text("target_profile").notNull(),
});

export type ServiceType = typeof serviceTypes.$inferSelect;
export type NewServiceType = typeof serviceTypes.$inferInsert;