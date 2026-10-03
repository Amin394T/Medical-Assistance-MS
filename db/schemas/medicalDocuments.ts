import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { medicalRecords } from "./medicalRecords";
import { serviceProviders } from "./serviceProviders";

export const medicalDocuments = sqliteTable("medical_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  type: text("type").notNull(),
  serviceProviderId: integer("service_provider_id").references(() => serviceProviders.id),
  observation: text("observation"),
  signed: integer("signed", { mode: "boolean" }).default(false),
});

export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type NewMedicalDocument = typeof medicalDocuments.$inferInsert;
