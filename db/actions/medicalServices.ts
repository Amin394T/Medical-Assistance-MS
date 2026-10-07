"use server";

import { eq, and } from "drizzle-orm";

import { db } from "../index";
import { medicalServices, serviceProviders, serviceTypes } from "../schemas";
import type { NewMedicalService, MedicalService } from "../schemas";

export async function listRecordMedicalServices(recordId: number) {
  const rows = await db
    .select()
    .from(medicalServices)
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .where(eq(medicalServices.medicalRecordId, recordId));
  
  return rows.map(({ medical_services, service_providers, service_types }) => ({
    ...medical_services,
    serviceProvider: service_providers.label,
    serviceType: service_types.label,
  }));
}

export async function createMedicalService(recordId: number, input: NewMedicalService) {
  await validateService(input.serviceProviderId, input.serviceTypeId);
  const [record] = await db
    .insert(medicalServices)
    .values({ ...input, medicalRecordId: recordId })
    .returning();
  return record;
}

export async function updateMedicalService(id: number, input: MedicalService) {
  await validateService(input.serviceProviderId, input.serviceTypeId);
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

async function validateService(serviceProviderId: number, serviceTypeId: number) {
  const [result] = await db
    .select()
    .from(serviceProviders)
    .innerJoin(serviceTypes, eq(serviceProviders.profile, serviceTypes.targetProfile))
    .where(and(
      eq(serviceProviders.id, serviceProviderId),
      eq(serviceTypes.id, serviceTypeId)
    ))
    .limit(1);
  if (!result) throw new Error("Service Provider And Type Mismatch");
}
