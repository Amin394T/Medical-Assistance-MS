"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalDocuments, medicalRecords, serviceProviders } from "../schemas";
import type { NewMedicalDocument } from "../schemas";

export async function listMedicalDocuments() {
  const rows = await db
    .select()
    .from(medicalDocuments)
    .innerJoin(medicalRecords, eq(medicalDocuments.medicalRecordId, medicalRecords.id))
    .innerJoin(serviceProviders, eq(medicalDocuments.serviceProviderId, serviceProviders.id));
  return rows.map(({ medical_documents, medical_records, service_providers }) => ({
    ...medical_documents,
    recordReference: medical_records.reference,
    providerLabel: service_providers.label,
  }));
}

export async function listMedicalDocumentsForRecord(recordId: number) {
  const rows = await db
    .select()
    .from(medicalDocuments)
    .innerJoin(serviceProviders, eq(medicalDocuments.serviceProviderId, serviceProviders.id))
    .where(eq(medicalDocuments.medicalRecordId, recordId));
  return rows.map(({ medical_documents, service_providers }) => ({
    ...medical_documents,
    providerLabel: service_providers.label,
  }));
}

export async function getMedicalDocument(id: number) {
  const [record] = await db.select().from(medicalDocuments).where(eq(medicalDocuments.id, id));
  return record ?? null;
}

export async function createMedicalDocument(input: NewMedicalDocument) {
  const [record] = await db.insert(medicalDocuments).values(input).returning();
  return record;
}

export async function updateMedicalDocument(id: number, input: Partial<NewMedicalDocument>) {
  const [record] = await db
    .update(medicalDocuments)
    .set(input)
    .where(eq(medicalDocuments.id, id))
    .returning();

  return record ?? null;
}

export async function deleteMedicalDocument(id: number) {
  const [record] = await db
    .delete(medicalDocuments)
    .where(eq(medicalDocuments.id, id))
    .returning();

  return record ?? null;
}
