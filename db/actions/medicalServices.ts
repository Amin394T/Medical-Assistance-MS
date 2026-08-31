"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalServices } from "../schemas";
import type { NewMedicalService } from "../schemas";

export async function listMedicalServices() {
  return db.select().from(medicalServices);
}

export async function getMedicalService(id: number) {
  const rows = await db.select().from(medicalServices).where(eq(medicalServices.id, id));
  return rows[0] ?? null;
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
