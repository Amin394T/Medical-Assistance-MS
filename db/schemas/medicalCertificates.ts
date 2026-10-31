import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { medicalRecords } from "./medicalRecords";
import { serviceProviders } from "./serviceProviders";

export const medicalCertificates = sqliteTable("medical_certificates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  type: text("type", { enum: ["INIT", "PROL", "RETU", "AGGR", "INSP", "RECO"] }).notNull(),
  serviceProviderId: integer("service_provider_id").references(() => serviceProviders.id),
  dayCount: integer("day_count").notNull(),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  observation: text("observation"),
});

export type MedicalCertificate = Omit<typeof medicalCertificates.$inferSelect, "medicalRecordId">;
export type NewMedicalCertificate = Omit<typeof medicalCertificates.$inferInsert, "medicalRecordId">;
