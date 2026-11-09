import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

import { billingInvoices } from "./billingInvoices";
import { medicalRecords } from "./medicalRecords";
import { serviceProviders } from "./serviceProviders";
import { serviceTypes } from "./serviceTypes";

export const medicalServices = sqliteTable("medical_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  serviceProviderId: integer("service_provider_id").notNull().references(() => serviceProviders.id),
  serviceTypeId: integer("service_type_id").notNull().references(() => serviceTypes.id),
  date: integer("date", { mode: "timestamp" }),
  observation: text("observation"),
  settlementStatus: text("settlement_status", { enum: ["WAIT", "BILL", "SETT"] }).notNull().default("WAIT"),
  settlingDate: integer("settling_date", { mode: "timestamp" }),
  invoiceId: integer("invoice_id").references(() => billingInvoices.id),
  paymentAmount: real("payment_amount").notNull(),
  billingAmount: real("billing_amount").notNull(),
  taxRate: real("tax_rate").notNull(),
  bank: text("bank"),
  paymentMode: text("payment_mode", { enum: ["CHQ", "VRM", "CSH"] }),
  paymentReference: text("payment_reference"),
});

export type MedicalService = Omit<typeof medicalServices.$inferSelect, "medicalRecordId">;
export type NewMedicalService = Omit<typeof medicalServices.$inferInsert, "medicalRecordId">;
