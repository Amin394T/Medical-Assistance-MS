"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { serviceProviders } from "../schemas";
import type { NewServiceProvider } from "../schemas";

export async function listServiceProviders() {
  return db.select().from(serviceProviders);
}

export async function getServiceProvider(id: number) {
  const [record] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
  return record ?? null;
}

export async function createServiceProvider(input: NewServiceProvider) {
  const [record] = await db.insert(serviceProviders).values(input).returning();
  return record;
}

export async function updateServiceProvider(id: number, input: Partial<NewServiceProvider>) {
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
