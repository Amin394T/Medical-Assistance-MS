"use server";

import { asc, count, desc, eq, or, sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";

import { db } from "../index";
import { insuranceProviders } from "../schemas";
import type { NewInsuranceProvider, InsuranceProvider } from "../schemas";
import { getGridPage } from "./gridList";
import type { GridListOptions } from "./gridListTypes";

export async function listInsuranceProviders() {
  return db
    .select()
    .from(insuranceProviders);
}

const INSURANCE_PROVIDER_SORT_KEYS = ["id", "label", "corporateId", "phone", "email"] as const;

export async function listInsuranceProvidersPage(options: GridListOptions = {}) {
  const search = options.search?.trim() ?? "";
  const contains = (value: SQLWrapper) => sql`instr(lower(coalesce(cast(${value} as text), '-')), lower(${search})) > 0`;
  const condition = search
    ? or(
      contains(insuranceProviders.label),
      contains(insuranceProviders.corporateId),
      contains(insuranceProviders.phone),
      contains(insuranceProviders.email),
    )
    : undefined;
  const [countRow] = await db.select({ total: count() }).from(insuranceProviders).where(condition);
  const totalCount = countRow?.total ?? 0;
  const { page, pageSize, offset } = getGridPage(totalCount, options);
  const sort = isInsuranceProviderSortKey(options.sort) ? options.sort : "label";
  const sortColumn = insuranceProviders[sort];
  const rows = await db
    .select()
    .from(insuranceProviders)
    .where(condition)
    .orderBy(options.sortDesc === false ? asc(sortColumn) : desc(sortColumn), asc(insuranceProviders.id))
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

function isInsuranceProviderSortKey(value: unknown): value is typeof INSURANCE_PROVIDER_SORT_KEYS[number] {
  return INSURANCE_PROVIDER_SORT_KEYS.some((key) => key === value);
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