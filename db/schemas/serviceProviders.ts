import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const serviceProviders = sqliteTable("service_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  corporateName: text("corporate_name"),
  profile: text("profile").notNull(),
  contactName: text("contact_name"),
  phone: text("phone").notNull(),
  email: text("email"),
});

export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type NewServiceProvider = typeof serviceProviders.$inferInsert;
