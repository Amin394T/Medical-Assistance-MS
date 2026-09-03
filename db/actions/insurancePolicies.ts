"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { insurancePolicies } from "../schemas";
import type { NewInsurancePolicy } from "../schemas";

export async function listInsurancePolicies() {
  return db.select().from(insurancePolicies);
}

export async function getInsurancePolicy(id: number) {
  const [record] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id));
  return record ?? null;
}

export async function createInsurancePolicy(input: NewInsurancePolicy) {
  const [record] = await db.insert(insurancePolicies).values(input).returning();
  return record;
}

export async function updateInsurancePolicy(id: number, input: Partial<NewInsurancePolicy>) {
  const [record] = await db
    .update(insurancePolicies)
    .set(input)
    .where(eq(insurancePolicies.id, id))
    .returning();

  return record ?? null;
}

export async function deleteInsurancePolicy(id: number) {
  const [record] = await db
    .delete(insurancePolicies)
    .where(eq(insurancePolicies.id, id))
    .returning();

  return record ?? null;
}
