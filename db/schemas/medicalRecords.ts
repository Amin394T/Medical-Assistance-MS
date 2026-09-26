import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insurancePolicies } from "./insurancePolicies";
import { serviceProviders } from "./serviceProviders";

export const medicalRecords = sqliteTable("medical_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  recordType: text("record_type", { enum: ["AT", "MD", "VF", "SS", "PR"] }).notNull().default("AT"),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id),
  reportingDate: integer("reporting_date", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  reporterFirstName: text("reporter_first_name").notNull(),
  reporterLastName: text("reporter_last_name"),
  reporterPhone: text("reporter_phone").notNull(),
  accidentPlace: text("accident_place", { enum: ["WS", "RT", "OF", "CS"] }).notNull(),
  accidentDate: integer("accident_date", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  accidentCause: text("accident_cause", { enum: ["FALL", "EQIP", "FATG", "HAZD", "VIOL", "OBJC"] }),
  victimFirstName: text("victim_first_name").notNull(),
  victimLastName: text("victim_last_name").notNull(),
  victimPhone: text("victim_phone"),
  victimNationalId: text("victim_national_id").notNull(),
  victimJob: text("victim_job"),
  accidentEvolution: text("accident_evolution", { enum: ["INIT", "DELG", "RELP", "DEAT", "COMP"] }).notNull().default("INIT"),
  delegationDate: integer("delegation_date", { mode: "timestamp_ms" }),
  coverageIssued: integer("coverage_issued", { mode: "boolean" }),
  coverageDate: integer("coverage_date", { mode: "timestamp_ms" }),
  regulatorId: integer("regulator_id").references(() => serviceProviders.id),
  recordStatus: text("record_status", { enum: ["PROG", "SETT", "CLOS", "ABAN", "BILL"] }).notNull().default("PROG"),
  lastAction: integer("last_action", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
  managedBy: text("managed_by").notNull().default("USER"),
  observation: text("observation"),
});

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;
