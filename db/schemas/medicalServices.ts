import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { medicalRecords } from "./medicalRecords";
import { serviceProviders } from "./serviceProviders";

export const medicalServices = sqliteTable("medical_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  service: text("service").notNull(),
  providerId: integer("provider_id").notNull().references(() => serviceProviders.id),
  missionDate: integer("mission_date", { mode: "timestamp_ms" }).notNull(),
  missionPlace: text("mission_place"),
  observations: text("observations"),
  settled: integer("settled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type MedicalService = typeof medicalServices.$inferSelect;
export type NewMedicalService = typeof medicalServices.$inferInsert;
