import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const serviceProviders = sqliteTable("service_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  name: text("name"),
  profile: text("profile", {
    enum: [
      "ambulance",
      "general practitioner",
      "emergency physician",
      "resuscitator",
      "diabetologist",
    ],
  }).notNull(),
  workerName: text("worker_name"),
  phone: text("phone").notNull(),
  fax: text("fax"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type NewServiceProvider = typeof serviceProviders.$inferInsert;
