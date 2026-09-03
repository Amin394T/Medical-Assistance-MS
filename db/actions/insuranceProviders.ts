"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { insuranceProviders } from "../schemas";
import type { NewInsuranceProvider } from "../schemas";

export async function listInsuranceProviders() {
  return db.select().from(insuranceProviders);
}

export async function getInsuranceProvider(id: number) {
  const [record] = await db.select().from(insuranceProviders).where(eq(insuranceProviders.id, id));
  return record ?? null;
}

export async function createInsuranceProvider(input: NewInsuranceProvider) {
  const [record] = await db.insert(insuranceProviders).values(input).returning();
  return record;
}

export async function updateInsuranceProvider(id: number, input: Partial<NewInsuranceProvider>) {
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
