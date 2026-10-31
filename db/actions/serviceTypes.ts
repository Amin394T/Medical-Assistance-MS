"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { serviceTypes } from "../schemas";
import type { NewServiceType, ServiceType } from "../schemas";

export async function listServiceTypes() {
  return db
    .select()
    .from(serviceTypes);
}

export async function listProfileServices(profile: string) {
  return await db
    .select()
    .from(serviceTypes)
    .where(eq(serviceTypes.targetProfile, profile));
}

export async function listProfiles() {
  const rows = await db
    .selectDistinct({ profile: serviceTypes.targetProfile })
    .from(serviceTypes);
  return rows.map(({ profile }) => profile);
}

export async function createServiceType(input: NewServiceType) {
  validateAmounts(input);
  const [record] = await db
    .insert(serviceTypes)
    .values(input)
    .returning();
  return record;
}

export async function updateServiceType(id: number, input: ServiceType) {
  validateAmounts(input);
  const [record] = await db
    .update(serviceTypes)
    .set(input)
    .where(eq(serviceTypes.id, id))
    .returning();
  return record ?? null;
}

export async function deleteServiceType(id: number) {
  const [record] = await db
    .delete(serviceTypes)
    .where(eq(serviceTypes.id, id))
    .returning();
  return record ?? null;
}

function validateAmounts(input: Pick<ServiceType, "paymentAmount" | "billingAmount" | "taxRate">) {
  for (const [label, value] of [
    ["Payment amount", input.paymentAmount],
    ["Billing amount", input.billingAmount],
    ["Tax rate", input.taxRate],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number.`);
  }
}