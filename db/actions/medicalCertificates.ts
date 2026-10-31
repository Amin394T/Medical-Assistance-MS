"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalCertificates, serviceProviders } from "../schemas";
import type { MedicalCertificate, NewMedicalCertificate } from "../schemas";

export async function listRecordMedicalCertificates(recordId: number) {
  const rows = await db
    .select()
    .from(medicalCertificates)
    .leftJoin(serviceProviders, eq(medicalCertificates.serviceProviderId, serviceProviders.id))
    .where(eq(medicalCertificates.medicalRecordId, recordId));

  return rows.map(({ medical_certificates, service_providers }) => ({
    ...medical_certificates,
    serviceProvider: service_providers?.label ?? null,
  }));
}

export async function createMedicalCertificate(recordId: number, input: NewMedicalCertificate) {
  validateCertificate(input.daysNumber, input.startDate, input.endDate);
  const [record] = await db
    .insert(medicalCertificates)
    .values({ ...input, medicalRecordId: recordId })
    .returning();
  return record;
}

export async function updateMedicalCertificate(id: number, input: MedicalCertificate) {
  validateCertificate(input.daysNumber, input.startDate, input.endDate);
  const [record] = await db
    .update(medicalCertificates)
    .set(input)
    .where(eq(medicalCertificates.id, id))
    .returning();
  return record ?? null;
}

export async function deleteMedicalCertificate(id: number) {
  const [record] = await db
    .delete(medicalCertificates)
    .where(eq(medicalCertificates.id, id))
    .returning();
  return record ?? null;
}

function validateCertificate(daysNumber: number, startDate: Date | null | undefined, endDate: Date | null | undefined) {
  if (!Number.isInteger(daysNumber) || daysNumber < 0) {
    throw new Error("Days number must be a non-negative whole number.");
  }
  if (startDate && endDate && startDate > endDate) {
    throw new Error("End date must be on or after start date.");
  }
}
