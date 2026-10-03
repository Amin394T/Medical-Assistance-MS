import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { insurancePolicies } from "./insurancePolicies";

export const medicalRecords = sqliteTable("medical_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: integer("reference").notNull().unique(),
  type: text("type", { enum: ["AT", "MD", "VF", "SS", "PR"] }).notNull().default("AT"),
  policyId: integer("policy_id").notNull().references(() => insurancePolicies.id),
  reportingDate: integer("reporting_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  reporterFirstName: text("reporter_first_name").notNull(),
  reporterLastName: text("reporter_last_name"),
  reporterPhone: text("reporter_phone").notNull(),
  accidentPlace: text("accident_place", { enum: ["WS", "RT", "OF", "CS"] }).notNull(),
  accidentDate: integer("accident_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  accidentCause: text("accident_cause", { enum: ["FALL", "EQIP", "FATG", "HAZD", "VIOL", "OBJC"] }),
  victimFirstName: text("victim_first_name").notNull(),
  victimLastName: text("victim_last_name").notNull(),
  victimPhone: text("victim_phone"),
  victimNationalId: text("victim_national_id").notNull(),
  victimJob: text("victim_job"),
  accidentEvolution: text("accident_evolution", { enum: ["INIT", "DELG", "RELP", "DEAT", "COMP"] }).notNull().default("INIT"),
  delegationDate: integer("delegation_date", { mode: "timestamp" }),
  coverageIssued: integer("coverage_issued", { mode: "boolean" }).default(false),
  coverageDate: integer("coverage_date", { mode: "timestamp" }),
  status: text("status", { enum: ["PROG", "SETT", "CLOS", "ABAN", "BILL"] }).notNull().default("PROG"),
  fate: text("fate", { enum: ["APPROVED", "REJECTED"] }),
  fateReason: text("fate_reason"),
  managedBy: text("managed_by").notNull(),
  observation: text("observation"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type MedicalRecord = Omit<typeof medicalRecords.$inferSelect, "createdAt" | "updatedAt">;

export type NewMedicalRecord = {
  type: "AT" | "MD" | "VF" | "SS" | "PR";
  policyId: number;
  reportingDate: Date;
  reporterFirstName: string;
  reporterLastName: string | null;
  reporterPhone: string;
  accidentPlace: "WS" | "RT" | "OF" | "CS";
  accidentDate: Date;
  accidentCause: "FALL" | "EQIP" | "FATG" | "HAZD" | "VIOL" | "OBJC" | null;
  victimFirstName: string;
  victimLastName: string;
  victimNationalId: string;
  victimPhone: string | null;
  victimJob: string | null;
  managedBy: string;
};

export type SetMedicalRecord = {
  type: "AT" | "MD" | "VF" | "SS" | "PR";
  policyId: number;
  reportingDate: Date;
  reporterFirstName: string;
  reporterLastName: string | null;
  reporterPhone: string;
  accidentPlace: "WS" | "RT" | "OF" | "CS";
  accidentDate: Date;
  accidentCause: "FALL" | "EQIP" | "FATG" | "HAZD" | "VIOL" | "OBJC" | null;
  victimFirstName: string;
  victimLastName: string;
  victimNationalId: string;
  victimPhone: string | null;
  victimJob: string | null;
  accidentEvolution: "INIT" | "DELG" | "RELP" | "DEAT" | "COMP";
  delegationDate: Date | null;
  coverageIssued: boolean | null;
  coverageDate: Date | null;
  status: "PROG" | "SETT" | "CLOS" | "ABAN" | "BILL";
  observation: string | null;
};