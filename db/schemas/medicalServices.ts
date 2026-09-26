import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { medicalRecords } from "./medicalRecords";
import { serviceProviders } from "./serviceProviders";
import { serviceTypes } from "./serviceTypes";

export const medicalServices = sqliteTable("medical_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => serviceProviders.id),
  serviceTypeId: integer("service_type_id").notNull().references(() => serviceTypes.id),
  missionDate: integer("mission_date", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  missionPlace: text("mission_place"),
  observation: text("observation"),
});

export type MedicalService = typeof medicalServices.$inferSelect;
export type NewMedicalService = typeof medicalServices.$inferInsert;
