import { sqliteTable, text, integer, AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const insuranceProviders = sqliteTable("insurance_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  companyName: text("company_name"),
  companyId: text("company_id"),
  type: text("type", { enum: ["company", "agent", "broker"] }).notNull(),
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const insuranceClients = sqliteTable("insurance_clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  name: text("name"),
  sector: text("sector"),
  phone: text("phone").notNull(),
  fax: text("fax"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const insurancePolicies = sqliteTable("insurance_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull(),
  clientCompanyId: integer("client_company_id").notNull().references(() => insuranceClients.id),
  effectiveDate: integer("effective_date", { mode: "timestamp_ms" }),
  insuranceCompanyId: integer("insurance_company_id").notNull().references(() => insuranceProviders.id),
  intermediateId: integer("intermediate_id").references(() => insuranceProviders.id),
  terminated: integer("terminated", { mode: "boolean" }).notNull().default(false),
  terminationDate: integer("termination_date", { mode: "timestamp_ms" }),
  type: text("type", { enum: ["revisable", "fixed-rate"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const serviceProviders = sqliteTable("service_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  name: text("name"),
  profile: text("profile", {
    enum: ["ambulance", "general practitioner", "emergency physician", "resuscitator", "diabetologist"],
  }).notNull(),
  workerName: text("worker_name"),
  phone: text("phone").notNull(),
  fax: text("fax"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

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