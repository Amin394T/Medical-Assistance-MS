"use server";

import { asc, count, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";

import { db } from "../index";
import { serviceProviders, serviceTypes } from "../schemas";
import type { NewServiceProvider, ServiceProvider } from "../schemas";
import { getGridPage } from "./gridList";
import type { GridListOptions } from "./gridListTypes";

export async function listServiceProviders() {
  return db
    .select()
    .from(serviceProviders);
}

export async function listServiceProviderBanks() {
  const rows = await db
    .selectDistinct({ bank: serviceProviders.bank })
    .from(serviceProviders)
    .where(isNotNull(serviceProviders.bank))
    .orderBy(asc(serviceProviders.bank));
  return rows.flatMap(({ bank }) => bank?.trim() ? [bank.trim()] : []);
}

const SERVICE_PROVIDER_SORT_KEYS = [
  "id",
  "label",
  "corporateName",
  "profile",
  "contactName",
  "phone",
  "email",
  "bank",
  "bankAccount",
] as const;

export async function listServiceProvidersPage(options: GridListOptions = {}) {
  const search = options.search?.trim() ?? "";
  const contains = (value: SQLWrapper) => sql`instr(lower(coalesce(cast(${value} as text), '-')), lower(${search})) > 0`;
  const condition = search
    ? or(
      contains(serviceProviders.label),
      contains(serviceProviders.corporateName),
      contains(serviceProviders.profile),
      contains(serviceProviders.contactName),
      contains(serviceProviders.phone),
      contains(serviceProviders.email),
      contains(serviceProviders.bank),
      contains(serviceProviders.bankAccount),
    )
    : undefined;
  const [countRow] = await db.select({ total: count() }).from(serviceProviders).where(condition);
  const totalCount = countRow?.total ?? 0;
  const { page, pageSize, offset } = getGridPage(totalCount, options);
  const sort = isServiceProviderSortKey(options.sort) ? options.sort : "label";
  const sortColumn = serviceProviders[sort];
  const rows = await db
    .select()
    .from(serviceProviders)
    .where(condition)
    .orderBy(options.sortDesc === false ? asc(sortColumn) : desc(sortColumn), asc(serviceProviders.id))
    .limit(pageSize)
    .offset(offset);
  return {
    rows,
    totalCount,
    page,
    pageSize,
    search,
    sort,
    sortDesc: options.sortDesc !== false,
  };
}

function isServiceProviderSortKey(value: unknown): value is typeof SERVICE_PROVIDER_SORT_KEYS[number] {
  return SERVICE_PROVIDER_SORT_KEYS.some((key) => key === value);
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
