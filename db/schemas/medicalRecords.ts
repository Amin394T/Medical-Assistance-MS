import { sqliteTable, integer, text, AnySQLiteColumn } from "drizzle-orm/sqlite-core";

import { insuranceClients } from "./insuranceClients";
import { insurancePolicies } from "./insurancePolicies";
import { insuranceProviders } from "./insuranceProviders";

export const medicalRecords = sqliteTable("medical_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accidentDate: integer("accident_date", { mode: "timestamp_ms" }).notNull(),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id),
  insuranceCompanyId: integer("insurance_company_id").notNull().references(() => insuranceProviders.id),
  referenceNumber: text("reference_number").notNull().unique(),
  clientCompanyId: integer("client_company_id").notNull().references(() => insuranceClients.id),
  recordType: text("record_type", { enum: ["normal", "verification"] }).notNull().default("normal"),
  reportingDate: integer("reporting_date", { mode: "timestamp_ms" }).notNull(),
  reporterFirstName: text("reporter_first_name").notNull(),
  reporterLastName: text("reporter_last_name"),
  reporterPhone: text("reporter_phone").notNull(),
  accidentType: text("accident_type", { enum: ["initial", "relapse", "sickness"] }),
  initialAccidentId: integer("initial_accident_id").references((): AnySQLiteColumn => medicalRecords.id),
  accidentPlace: text("accident_place", { enum: ["workshop", "route", "office", "site"] }).notNull(),
  victimFirstName: text("victim_first_name").notNull(),
  victimLastName: text("victim_last_name").notNull(),
  victimNationalId: text("victim_national_id").notNull(),
  victimPhone: text("victim_phone"),
  accidentCause: text("accident_cause", {
    enum: [
      "falling or slipping",
      "machine or equipment",
      "overexertion and fatigue",
      "hazardous substance",
      "workplace violence",
      "moving objects",
    ],
  }),
  recordStatus: text("record_status", {
    enum: ["in progress", "settled", "closed", "abandoned", "billable"],
  }).notNull().default("in progress"),
  recordFate: text("record_fate", {
    enum: ["waiting", "approved", "rejected", "abandoned"],
  }).notNull().default("waiting"),
  fateReason: text("fate_reason"),
  intermediateId: integer("intermediate_id").references(() => insuranceProviders.id),
  managedBy: text("managed_by"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;
