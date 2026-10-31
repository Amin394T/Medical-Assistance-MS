import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

import { invoices } from "./invoices";
import { medicalRecords } from "./medicalRecords";
import { serviceProviders } from "./serviceProviders";
import { serviceTypes } from "./serviceTypes";

export const medicalServices = sqliteTable("medical_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => serviceProviders.id),
  serviceTypeId: integer("service_type_id").notNull().references(() => serviceTypes.id),
  serviceDate: integer("service_date", { mode: "timestamp" }),
  feeAmount: real("fee_amount").notNull().default(0),
  billedAmount: real("billed_amount").default(0),
  taxRate: real("tax_rate").default(0),
  billingStatus: text("billing_status", { enum: ["WTN", "BLD", "STL"] }).notNull().default("WTN"),
  settlingDate: integer("settling_date", { mode: "timestamp" }),
  bank: text("bank"),
  paymentMode: text("payment_mode", { enum: ["CHQ", "VRM", "CSH"] }),
  paymentReference: text("payment_reference"),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  observation: text("observation"),
});

export type MedicalService = Omit<typeof medicalServices.$inferSelect, "medicalRecordId">;
export type NewMedicalService = Omit<typeof medicalServices.$inferInsert, "medicalRecordId">;
