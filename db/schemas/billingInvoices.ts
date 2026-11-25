import { sqliteTable, integer, real } from "drizzle-orm/sqlite-core";

import { medicalRecords } from "./medicalRecords";
import { invoiceCollections } from "./invoiceCollections";

export const billingInvoices = sqliteTable("billing_invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicalRecordId: integer("medical_record_id").notNull().references(() => medicalRecords.id),
  reference: integer("reference").notNull().unique(),
  issueDate: integer("issue_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  totalAmount: real("total_amount").notNull(),
  collectionId: integer("collection_id").references(() => invoiceCollections.id),
});

export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type NewBillingInvoice = typeof billingInvoices.$inferInsert;
