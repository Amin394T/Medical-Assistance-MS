"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { medicalDocuments } from "../schemas";
import type { NewMedicalDocument } from "../schemas";

export async function listMedicalDocuments() {
  return db.select().from(medicalDocuments);
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
