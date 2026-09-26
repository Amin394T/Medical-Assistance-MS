"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { serviceProviders, serviceTypes } from "../schemas";
import type { NewServiceProvider } from "../schemas";

export async function listServiceProviders() {
  return db.select().from(serviceProviders);
}

export async function getServiceProvider(id: number) {
  const [record] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
  return record ?? null;
}

export async function createServiceProvider(input: NewServiceProvider) {
  await validateProfile(input.profile);
  const [record] = await db.insert(serviceProviders).values(input).returning();
  return record;
}

export async function updateServiceProvider(id: number, input: Partial<NewServiceProvider>) {
  if (input.profile !== undefined) await validateProfile(input.profile);
  const [record] = await db
    .update(serviceProviders)
    .set(input)
    .where(eq(serviceProviders.id, id))
    .returning();

  return record ?? null;
}

export async function listServiceProviderProfiles() {
  const rows = await db.selectDistinct({ profile: serviceTypes.targetProfile }).from(serviceTypes);
  return rows.map(({ profile }) => profile);
}

export async function deleteServiceProvider(id: number) {
  const [record] = await db
    .delete(serviceProviders)
    .where(eq(serviceProviders.id, id))
    .returning();

  return record ?? null;
}

async function validateProfile(profile: string) {
  const [serviceType] = await db.select({ id: serviceTypes.id }).from(serviceTypes).where(eq(serviceTypes.targetProfile, profile)).limit(1);
  if (!serviceType) throw new Error("The provider profile must be defined by a service type.");
}
