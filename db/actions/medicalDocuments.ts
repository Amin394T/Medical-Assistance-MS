"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalDocuments, serviceProviders } from "../schemas";
import type { NewMedicalDocument, MedicalDocument } from "../schemas";

export async function listRecordMedicalDocuments(recordId: number) {
  const rows = await db
    .select()
    .from(medicalDocuments)
    .innerJoin(serviceProviders, eq(medicalDocuments.serviceProviderId, serviceProviders.id))
    .where(eq(medicalDocuments.medicalRecordId, recordId));

  return rows.map(({ medical_documents, service_providers }) => ({
    ...medical_documents,
    serviceProvider: service_providers.label,
  }));
}

export async function listDocumentTypes() {
  const rows = await db
    .selectDistinct({ type: medicalDocuments.type })
    .from(medicalDocuments);
  return rows.map(({ type }) => type);
}

export async function createMedicalDocument(recordId: number, input: NewMedicalDocument) {
  const [record] = await db
    .insert(medicalDocuments)
    .values({ ...input, medicalRecordId: recordId })
    .returning();
  return record;
}

export async function updateMedicalDocument(id: number, input: MedicalDocument) {
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
