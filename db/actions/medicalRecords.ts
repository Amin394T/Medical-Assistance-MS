"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalRecords } from "../schemas";
import type { NewMedicalRecord } from "../schemas";

export async function listMedicalRecords() {
  return db.select().from(medicalRecords);
}

export async function getMedicalRecord(id: number) {
  const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
  return record ?? null;
}

export async function createMedicalRecord(input: NewMedicalRecord) {
  const [record] = await db.insert(medicalRecords).values(input).returning();
  return record;
}

export async function updateMedicalRecord(id: number, input: Partial<NewMedicalRecord>) {
  const [record] = await db
    .update(medicalRecords)
    .set(input)
    .where(eq(medicalRecords.id, id))
    .returning();

  return record ?? null;
}

export async function deleteMedicalRecord(id: number) {
  const [record] = await db
    .delete(medicalRecords)
    .where(eq(medicalRecords.id, id))
    .returning();

  return record ?? null;
}
