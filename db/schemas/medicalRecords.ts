import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insurancePolicies } from "./insurancePolicies";

export const medicalRecords = sqliteTable("medical_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: integer("reference").notNull().unique(),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id),
  reportingDate: integer("reporting_date", { mode: "timestamp" }).notNull(),
  reporterName: text("reporter_name"),
  reporterPhone: text("reporter_phone"),
  accidentDate: integer("accident_date", { mode: "timestamp" }).notNull(),
  accidentType: text("accident_type", { enum: ["AT", "MD", "VP", "SS", "MP"] }).notNull(),
  accidentPlace: text("accident_place", { enum: ["WKS", "RUT", "OFC", "CST"] }),
  accidentCause: text("accident_cause", { enum: ["FAL", "EQP", "FTG", "HZD", "VLC", "OBJ"] }),
  accidentEvolution: text("accident_evolution", { enum: ["INT", "RLP", "DTH", "CMP"] }).notNull(),
  victimFirstName: text("victim_first_name"),
  victimLastName: text("victim_last_name"),
  victimPhone: text("victim_phone"),
  victimNationalId: text("victim_national_id"),
  victimJob: text("victim_job"),
  status: text("status", { enum: ["PRG", "RJC", "DSP", "CLS", "ABN"] }).notNull(),
  statusReason: text("status_reason", { enum: ["SPD", "TRM", "LMT"] }),
  regulatoryDoctor: text("regulatory_doctor"),
  manager: text("manager").notNull(),
  observation: text("observation"),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
  lastUpdater: text("last_updater").notNull(),
});

export type MedicalRecord = typeof medicalRecords.$inferSelect;

export type NewMedicalRecord = {
  policyId: number;
  reportingDate: Date;
  reporterName: string | null;
  reporterPhone: string | null;
  accidentDate: Date;
  accidentType: "AT" | "MD" | "VP" | "SS" | "MP";
  accidentPlace: "WKS" | "RUT" | "OFC" | "CST" | null;
  accidentCause: "FAL" | "EQP" | "FTG" | "HZD" | "VLC" | "OBJ" | null;
  accidentEvolution: "INT" | "RLP" | "DTH" | "CMP";
  victimFirstName: string | null;
  victimLastName: string | null;
  victimPhone: string | null;
  victimNationalId: string | null;
  victimJob: string | null;
};

export type SetMedicalRecord = {
  reportingDate: Date;
  reporterName: string | null;
  reporterPhone: string | null;
  accidentDate: Date;
  accidentType: "AT" | "MD" | "VP" | "SS" | "MP";
  accidentPlace: "WKS" | "RUT" | "OFC" | "CST" | null;
  accidentCause: "FAL" | "EQP" | "FTG" | "HZD" | "VLC" | "OBJ" | null;
  accidentEvolution: "INT" | "RLP" | "DTH" | "CMP";
  victimFirstName: string | null;
  victimLastName: string | null;
  victimPhone: string | null;
  victimNationalId: string | null;
  victimJob: string | null;
  status: "PRG" | "RJC" | "DSP" | "CLS" | "ABN";
  statusReason: "SPD" | "TRM" | "LMT" | null;
  regulatoryDoctor: string | null;
  observation: string | null;
};