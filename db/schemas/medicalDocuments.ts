import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { medicalRecords } from "./medicalRecords";

export const medicalDocuments = sqliteTable("medical_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  type: text("type", { enum: ["record details", "coverage", "others"] }).notNull(),
  lastPrintedAt: integer("last_printed_at", { mode: "timestamp_ms" }),
  observations: text("observations"),
  signed: integer("signed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type NewMedicalDocument = typeof medicalDocuments.$inferInsert;
