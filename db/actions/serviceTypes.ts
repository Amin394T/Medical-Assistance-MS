"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { serviceTypes } from "../schemas";
import type { NewServiceType } from "../schemas";

export async function listServiceTypes() {
  return db.select().from(serviceTypes);
}

export async function getServiceType(id: number) {
  const [serviceType] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, id));
  return serviceType ?? null;
}

export async function createServiceType(input: NewServiceType) {
  const [serviceType] = await db.insert(serviceTypes).values(input).returning();
  return serviceType;
}

export async function updateServiceType(id: number, input: Partial<NewServiceType>) {
  const [serviceType] = await db.update(serviceTypes).set(input).where(eq(serviceTypes.id, id)).returning();
  return serviceType ?? null;
}

export async function deleteServiceType(id: number) {
  const [serviceType] = await db.delete(serviceTypes).where(eq(serviceTypes.id, id)).returning();
  return serviceType ?? null;
}