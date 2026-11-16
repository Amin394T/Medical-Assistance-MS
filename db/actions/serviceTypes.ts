"use server";

import { asc, count, desc, eq, or, sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";

import { db } from "../index";
import { serviceTypes } from "../schemas";
import type { NewServiceType, ServiceType } from "../schemas";
import { getGridPage } from "./gridList";
import type { GridListOptions } from "./gridListTypes";

export async function listServiceTypes() {
  return db
    .select()
    .from(serviceTypes);
}

const SERVICE_TYPE_SORT_KEYS = ["id", "label", "paymentAmount", "billingAmount", "taxRate", "targetProfile"] as const;

export async function listServiceTypesPage(options: GridListOptions = {}) {
  const search = options.search?.trim() ?? "";
  const contains = (value: SQLWrapper) => sql`instr(lower(coalesce(cast(${value} as text), '-')), lower(${search})) > 0`;
  const condition = search
    ? or(
      contains(serviceTypes.label),
      contains(serviceTypes.paymentAmount),
      contains(serviceTypes.billingAmount),
      contains(serviceTypes.taxRate),
      contains(serviceTypes.targetProfile),
    )
    : undefined;
  const [countRow] = await db.select({ total: count() }).from(serviceTypes).where(condition);
  const totalCount = countRow?.total ?? 0;
  const { page, pageSize, offset } = getGridPage(totalCount, options);
  const sort = isServiceTypeSortKey(options.sort) ? options.sort : "label";
  const sortColumn = serviceTypes[sort];
  const rows = await db
    .select()
    .from(serviceTypes)
    .where(condition)
    .orderBy(options.sortDesc === false ? asc(sortColumn) : desc(sortColumn), asc(serviceTypes.id))
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

function isServiceTypeSortKey(value: unknown): value is typeof SERVICE_TYPE_SORT_KEYS[number] {
  return SERVICE_TYPE_SORT_KEYS.some((key) => key === value);
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