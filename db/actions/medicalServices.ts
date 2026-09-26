"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalRecords, medicalServices, serviceProviders, serviceTypes } from "../schemas";
import type { MedicalService, NewMedicalService } from "../schemas";

export type MedicalServiceListItem = MedicalService & {
  recordReference: string;
  providerLabel: string;
  serviceTypeLabel: string;
};

export async function listMedicalServices() {
  const rows = await db
    .select()
    .from(medicalServices)
    .innerJoin(medicalRecords, eq(medicalServices.medicalRecordId, medicalRecords.id))
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id));

  return rows.map(({ medical_services, medical_records, service_providers, service_types }) => ({
    ...medical_services,
    recordReference: medical_records.reference,
    providerLabel: service_providers.label,
    serviceTypeLabel: service_types.label,
  })) satisfies MedicalServiceListItem[];
}

export async function listMedicalServicesForRecord(recordId: number) {
  const rows = await db
    .select()
    .from(medicalServices)
    .innerJoin(serviceProviders, eq(medicalServices.serviceProviderId, serviceProviders.id))
    .innerJoin(serviceTypes, eq(medicalServices.serviceTypeId, serviceTypes.id))
    .where(eq(medicalServices.medicalRecordId, recordId));
  return rows.map(({ medical_services, service_providers, service_types }) => ({
    ...medical_services,
    providerLabel: service_providers.label,
    serviceTypeLabel: service_types.label,
  }));
}

export async function getMedicalService(id: number) {
  const [record] = await db.select().from(medicalServices).where(eq(medicalServices.id, id));
  return record ?? null;
}

export async function createMedicalService(input: NewMedicalService) {
  await validateServiceProfile(input.serviceProviderId, input.serviceTypeId);
  const [record] = await db.insert(medicalServices).values(input).returning();
  return record;
}

export async function updateMedicalService(id: number, input: Partial<NewMedicalService>) {
  const [current] = await db.select().from(medicalServices).where(eq(medicalServices.id, id));
  if (!current) return null;
  await validateServiceProfile(input.serviceProviderId ?? current.serviceProviderId, input.serviceTypeId ?? current.serviceTypeId);
  const [record] = await db
    .update(medicalServices)
    .set(input)
    .where(eq(medicalServices.id, id))
    .returning();

  return record ?? null;
}

async function validateServiceProfile(serviceProviderId: number, serviceTypeId: number) {
  const [serviceProvider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, serviceProviderId));
  const [serviceType] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, serviceTypeId));
  if (!serviceProvider || !serviceType || serviceProvider.profile !== serviceType.targetProfile) {
    throw new Error("The service type must match the service provider profile.");
  }
}

export async function deleteMedicalService(id: number) {
  const [record] = await db
    .delete(medicalServices)
    .where(eq(medicalServices.id, id))
    .returning();

  return record ?? null;
}
