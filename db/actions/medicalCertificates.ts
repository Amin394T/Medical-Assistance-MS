"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { touchMedicalRecord } from "./medicalRecordAudit";
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
  validateCertificate(input.dayCount, input.startDate, input.endDate);
  return db.transaction((tx) => {
    const [record] = tx
      .insert(medicalCertificates)
      .values({ ...input, medicalRecordId: recordId })
      .returning()
      .all();
    if (!record) throw new Error("The medical certificate could not be created.");
    touchMedicalRecord(tx, recordId);
    return record;
  });
}

export async function updateMedicalCertificate(id: number, input: MedicalCertificate) {
  validateCertificate(input.dayCount, input.startDate, input.endDate);
  return db.transaction((tx) => {
    const [existing] = tx
      .select({ medicalRecordId: medicalCertificates.medicalRecordId })
      .from(medicalCertificates)
      .where(eq(medicalCertificates.id, id))
      .all();
    if (!existing) return null;

    const [record] = tx
      .update(medicalCertificates)
      .set(input)
      .where(eq(medicalCertificates.id, id))
      .returning()
      .all();
    if (record) touchMedicalRecord(tx, existing.medicalRecordId);
    return record ?? null;
  });
}

export async function deleteMedicalCertificate(id: number) {
  const [record] = await db
    .delete(medicalCertificates)
    .where(eq(medicalCertificates.id, id))
    .returning();
  return record ?? null;
}

function validateCertificate(dayCount: number, startDate: Date | null | undefined, endDate: Date | null | undefined) {
  if (!Number.isInteger(dayCount) || dayCount < 0) {
    throw new Error("Day count must be a non-negative whole number.");
  }
  if (startDate && endDate && startDate > endDate) {
    throw new Error("End date must be on or after start date.");
  }
}
