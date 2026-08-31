"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { insuranceClients } from "../schemas";
import type { NewInsuranceClient } from "../schemas";

export async function listInsuranceClients() {
  return db.select().from(insuranceClients);
}

export async function getInsuranceClient(id: number) {
  const rows = await db.select().from(insuranceClients).where(eq(insuranceClients.id, id));
  return rows[0] ?? null;
}

export async function createInsuranceClient(input: NewInsuranceClient) {
  const [record] = await db.insert(insuranceClients).values(input).returning();
  return record;
}

export async function updateInsuranceClient(id: number, input: Partial<NewInsuranceClient>) {
  const [record] = await db
    .update(insuranceClients)
    .set(input)
    .where(eq(insuranceClients.id, id))
    .returning();

  return record ?? null;
}

export async function deleteInsuranceClient(id: number) {
  const [record] = await db
    .delete(insuranceClients)
    .where(eq(insuranceClients.id, id))
    .returning();

  return record ?? null;
}
