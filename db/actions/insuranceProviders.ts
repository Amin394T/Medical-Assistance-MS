"use server";

import { and, asc, count, desc, eq, or, sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";

import { db } from "../index";
import { insuranceCommissions, insuranceProviders } from "../schemas";
import type { NewInsuranceProvider, InsuranceProvider } from "../schemas";
import { getGridPage } from "./gridList";
import type { GridListOptions } from "./gridListTypes";

export async function listInsuranceProviders() {
  return db.select({
    id: insuranceProviders.id,
    label: insuranceProviders.label,
    phone: insuranceProviders.phone,
    email: insuranceProviders.email,
    recordFees: insuranceCommissions.commission,
  }).from(insuranceProviders)
    .leftJoin(insuranceCommissions, and(
      eq(insuranceCommissions.providerId, insuranceProviders.id),
      eq(insuranceCommissions.recordType, "AT"),
    ));
}

export async function listInsuranceProviderCommissions(providerId: number) {
  const rows = await db.select({
    recordType: insuranceCommissions.recordType,
    commission: insuranceCommissions.commission,
  }).from(insuranceCommissions).where(eq(insuranceCommissions.providerId, providerId));
  const values = new Map(rows.map(({ recordType, commission }) => [recordType, commission]));
  return ["AT", "MD", "VP", "SS", "MP"].map((type) => `${type}|${values.get(type as typeof rows[number]["recordType"]) ?? 0}`);
}

export async function updateInsuranceProviderCommissions(providerId: number, items: string[]) {
  const types = ["AT", "MD", "VP", "SS", "MP"] as const;
  if (items.length !== types.length) throw new Error("All record-type commissions must be provided.");
  const commissions = items.map((item, index) => {
    const [type, rawCommission] = item.split("|");
    const amount = Number(rawCommission);
    if (type !== types[index] || !Number.isFinite(amount)) throw new Error("Enter a valid commission for each record type.");
    return { providerId, recordType: type, commission: amount };
  });
  await db.transaction((tx) => {
    tx.delete(insuranceCommissions).where(eq(insuranceCommissions.providerId, providerId)).run();
    tx.insert(insuranceCommissions).values(commissions).run();
  });
  return commissions;
}

const INSURANCE_PROVIDER_SORT_KEYS = ["label", "phone", "email"] as const;

export async function listInsuranceProvidersPage(options: GridListOptions = {}) {
  const search = options.search?.trim() ?? "";
  const contains = (value: SQLWrapper) => sql`instr(lower(coalesce(cast(${value} as text), '-')), lower(${search})) > 0`;
  const condition = search
    ? or(
      contains(insuranceProviders.label),
      contains(insuranceProviders.phone),
      contains(insuranceProviders.email),
    )
    : undefined;
  const [countRow] = await db.select({ total: count() }).from(insuranceProviders).where(condition);
  const totalCount = countRow?.total ?? 0;
  const { page, pageSize, offset } = getGridPage(totalCount, options);
  const sort = isInsuranceProviderSortKey(options.sort) ? options.sort : "label";
  const sortColumn = sort === "label" ? insuranceProviders.label : sort === "phone" ? insuranceProviders.phone : insuranceProviders.email;
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
    .set({ label: input.label, phone: input.phone, email: input.email })
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