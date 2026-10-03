"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { serviceProviders, serviceTypes } from "../schemas";
import type { NewServiceProvider, ServiceProvider } from "../schemas";

export async function listServiceProviders() {
  return db
    .select()
    .from(serviceProviders);
}

export async function createServiceProvider(input: NewServiceProvider) {
  await validateProfile(input.profile);
  const [record] = await db
    .insert(serviceProviders)
    .values(input)
    .returning();
  return record;
}

export async function updateServiceProvider(id: number, input: ServiceProvider) {
  await validateProfile(input.profile);
  const [record] = await db
    .update(serviceProviders)
    .set(input)
    .where(eq(serviceProviders.id, id))
    .returning();
  return record ?? null;
}

export async function deleteServiceProvider(id: number) {
  const [record] = await db
    .delete(serviceProviders)
    .where(eq(serviceProviders.id, id))
    .returning();
  return record ?? null;
}

async function validateProfile(profile: string) {
  const [result] = await db
    .select({ id: serviceTypes.id })
    .from(serviceTypes)
    .where(eq(serviceTypes.targetProfile, profile))
    .limit(1);
  if (!result) throw new Error("No Such Service Profile");
}
