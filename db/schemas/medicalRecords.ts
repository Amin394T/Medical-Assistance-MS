import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insurancePolicies } from "./insurancePolicies";

export const medicalRecords = sqliteTable("medical_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: integer("reference").notNull().unique(),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id),
  reportingDate: integer("reporting_date", { mode: "timestamp" }).notNull(),
  reporterName: text("reporter_name"),
  reporterPhone: text("reporter_phone").notNull(),
  accidentDate: integer("accident_date", { mode: "timestamp" }).notNull(),
  accidentType: text("accident_type", { enum: ["AT", "MD", "VF", "SS", "PR", "AV"] }).notNull(),
  accidentPlace: text("accident_place", { enum: ["WS", "RT", "OF", "CT"] }).notNull(),
  accidentCause: text("accident_cause", { enum: ["FALL", "EQIP", "FATG", "HAZD", "VIOL", "OBJC"] }).notNull(),
  accidentEvolution: text("accident_evolution", { enum: ["INIT", "RELP", "DEAT", "COMP"] }).notNull(),
  victimFirstName: text("victim_first_name").notNull(),
  victimLastName: text("victim_last_name"),
  victimPhone: text("victim_phone"),
  victimNationalId: text("victim_national_id").notNull(),
  victimJob: text("victim_job"),
  status: text("status", { enum: ["PRG", "RJC", "CLS", "ABN"] }).notNull(),
  delegationDate: integer("delegation_date", { mode: "timestamp" }),
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
  reporterPhone: string;
  accidentDate: Date;
  accidentType: "AT" | "MD" | "VF" | "SS" | "PR" | "AV";
  accidentPlace: "WS" | "RT" | "OF" | "CT";
  accidentCause: "FALL" | "EQIP" | "FATG" | "HAZD" | "VIOL" | "OBJC" | null;
  accidentEvolution: "INIT" | "RELP" | "DEAT" | "COMP";
  victimFirstName: string;
  victimLastName: string | null;
  victimPhone: string | null;
  victimNationalId: string;
  victimJob: string | null;
};

export type SetMedicalRecord = {
  policyId: number;
  reportingDate: Date;
  reporterName: string | null;
  reporterPhone: string;
  accidentDate: Date;
  accidentType: "AT" | "MD" | "VF" | "SS" | "PR" | "AV";
  accidentPlace: "WS" | "RT" | "OF" | "CT";
  accidentCause: "FALL" | "EQIP" | "FATG" | "HAZD" | "VIOL" | "OBJC" | null;
  accidentEvolution: "INIT" | "RELP" | "DEAT" | "COMP";
  victimFirstName: string;
  victimLastName: string | null;
  victimPhone: string | null;
  victimNationalId: string;
  victimJob: string | null;
  status: "PRG" | "RJC" | "CLS" | "ABN";
  delegationDate: Date | null;
  regulatoryDoctor: string | null;
  observation: string | null;
};