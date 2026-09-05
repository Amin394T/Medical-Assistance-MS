"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalRecords, medicalServices, serviceProviders } from "../schemas";
import type { MedicalService, NewMedicalService } from "../schemas";

export type MedicalServiceListItem = MedicalService & {
  recordReference: string;
  providerLabel: string;
};

export async function listMedicalServices() {
  const rows = await db
    .select()
    .from(medicalServices)
    .innerJoin(medicalRecords, eq(medicalServices.medicalRecordId, medicalRecords.id))
    .innerJoin(serviceProviders, eq(medicalServices.providerId, serviceProviders.id));

  return rows.map(({ medical_services, medical_records, service_providers }) => ({
    ...medical_services,
    recordReference: medical_records.referenceNumber,
    providerLabel: service_providers.label,
  })) satisfies MedicalServiceListItem[];
}

export async function getMedicalService(id: number) {
  const [record] = await db.select().from(medicalServices).where(eq(medicalServices.id, id));
  return record ?? null;
}

export async function createMedicalService(input: NewMedicalService) {
  const [record] = await db.insert(medicalServices).values(input).returning();
  return record;
}

export async function updateMedicalService(id: number, input: Partial<NewMedicalService>) {
  const [record] = await db
    .update(medicalServices)
    .set(input)
    .where(eq(medicalServices.id, id))
    .returning();

  return record ?? null;
}

export async function deleteMedicalService(id: number) {
  const [record] = await db
    .delete(medicalServices)
    .where(eq(medicalServices.id, id))
    .returning();

  return record ?? null;
}
