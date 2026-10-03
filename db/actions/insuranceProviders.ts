"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { insuranceProviders } from "../schemas";
import type { NewInsuranceProvider, InsuranceProvider } from "../schemas";

export async function listInsuranceProviders() {
  return db
    .select()
    .from(insuranceProviders);
}

export async function createInsuranceProvider(input: NewInsuranceProvider) {
  const [record] = await db
    .insert(insuranceProviders)
    .values(input)
    .returning();
  return record;
}

export async function updateInsuranceProvider(id: number, input: InsuranceProvider) {
  const [record] = await db
    .update(insuranceProviders)
    .set(input)
    .where(eq(insuranceProviders.id, id))
    .returning();
  return record ?? null;
}

export async function deleteInsuranceProvider(id: number) {
  const [record] = await db
    .delete(insuranceProviders)
    .where(eq(insuranceProviders.id, id))
    .returning();
  return record ?? null;
}

// TODO: prevent deletion if used by insurance policy