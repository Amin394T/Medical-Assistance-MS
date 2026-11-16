"use server";

import { asc, count, desc, eq, or, sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../index";
import { getGridPage } from "./gridList";
import type { GridListOptions } from "./gridListTypes";
import { insurancePolicies, insurancePolicyEmployees, insuranceProviders } from "../schemas";
import type { InsurancePolicy, NewInsurancePolicy } from "../schemas";
import { normalizeEmployeeName } from "./policyEmployeeNames";

export async function listInsurancePolicies() {
  const insuranceCompany = alias(insuranceProviders, "insuranceCompany");
  const rows = await db
    .select()
    .from(insurancePolicies)
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceCompanyId, insuranceCompany.id))
    .orderBy(desc(insurancePolicies.creationDate));

  return rows.map(({ insurance_policies, insuranceCompany }) => ({
    ...insurance_policies,
    insuranceCompany: insuranceCompany.label,
  }));
}

const INSURANCE_POLICY_SORT_KEYS = [
  "policyNumber",
  "clientCompany",
  "clientActivity",
  "clientAddress",
  "clientCity",
  "type",
  "effectiveDate",
  "status",
  "insuranceCompanyId",
  "creationDate",
  "lastUpdated",
] as const;

const POLICY_TYPE_LABEL = sql`case ${insurancePolicies.type}
  when 'REV' then 'Revisable'
  when 'FIX' then 'Fixed-rate'
end`;
const POLICY_STATUS_LABEL = sql`case ${insurancePolicies.status}
  when 'VALI' then 'Valid'
  when 'SUSP' then 'Suspended'
  when 'TERM' then 'Terminated'
end`;

export async function listInsurancePoliciesPage(options: GridListOptions = {}) {
  const insuranceCompany = alias(insuranceProviders, "insuranceCompany");
  const search = options.search?.trim() ?? "";
  const contains = (value: SQLWrapper) => sql`instr(lower(coalesce(cast(${value} as text), '-')), lower(${search})) > 0`;
  const condition = search
    ? or(
      contains(insurancePolicies.policyNumber),
      contains(insurancePolicies.clientCompany),
      contains(insurancePolicies.clientActivity),
      contains(insurancePolicies.clientAddress),
      contains(insurancePolicies.clientCity),
      contains(POLICY_TYPE_LABEL),
      contains(insurancePolicies.type),
      contains(sql`strftime('%d-%m-%Y', ${insurancePolicies.effectiveDate}, 'unixepoch', 'localtime')`),
      contains(POLICY_STATUS_LABEL),
      contains(insuranceCompany.label),
      contains(sql`strftime('%d-%m-%Y %H:%M:%S', ${insurancePolicies.creationDate}, 'unixepoch', 'localtime')`),
      contains(sql`strftime('%d-%m-%Y %H:%M:%S', ${insurancePolicies.lastUpdated}, 'unixepoch', 'localtime')`),
    )
    : undefined;
  const [countRow] = await db
    .select({ total: count() })
    .from(insurancePolicies)
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceCompanyId, insuranceCompany.id))
    .where(condition);
  const totalCount = countRow?.total ?? 0;
  const { page, pageSize, offset } = getGridPage(totalCount, options);
  const sort = isInsurancePolicySortKey(options.sort) ? options.sort : "creationDate";
  const sortColumn = getInsurancePolicySortColumn(sort, insuranceCompany.label);
  const rows = await db
    .select()
    .from(insurancePolicies)
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceCompanyId, insuranceCompany.id))
    .where(condition)
    .orderBy(options.sortDesc === false ? asc(sortColumn) : desc(sortColumn), asc(insurancePolicies.id))
    .limit(pageSize)
    .offset(offset);
  return {
    rows: rows.map(({ insurance_policies, insuranceCompany }) => ({
      ...insurance_policies,
      insuranceCompany: insuranceCompany.label,
    })),
    totalCount,
    page,
    pageSize,
    search,
    sort,
    sortDesc: options.sortDesc !== false,
  };
}

function isInsurancePolicySortKey(value: unknown): value is typeof INSURANCE_POLICY_SORT_KEYS[number] {
  return INSURANCE_POLICY_SORT_KEYS.some((key) => key === value);
}

function getInsurancePolicySortColumn(sort: typeof INSURANCE_POLICY_SORT_KEYS[number], companyLabel: SQLWrapper) {
  switch (sort) {
    case "policyNumber": return insurancePolicies.policyNumber;
    case "clientCompany": return insurancePolicies.clientCompany;
    case "clientActivity": return insurancePolicies.clientActivity;
    case "clientAddress": return insurancePolicies.clientAddress;
    case "clientCity": return insurancePolicies.clientCity;
    case "type": return POLICY_TYPE_LABEL;
    case "effectiveDate": return insurancePolicies.effectiveDate;
    case "status": return POLICY_STATUS_LABEL;
    case "insuranceCompanyId": return companyLabel;
    case "creationDate": return insurancePolicies.creationDate;
    case "lastUpdated": return insurancePolicies.lastUpdated;
  }
}

export async function listInsurancePolicyEmployees(policyIdValue: number) {
  const policyId = requiredId(policyIdValue, "Insurance policy");
  const [policy] = await db
    .select({ type: insurancePolicies.type })
    .from(insurancePolicies)
    .where(eq(insurancePolicies.id, policyId));
  if (!policy) throw new Error("Insurance policy not found.");
  if (policy.type !== "FIX") throw new Error("Covered employees are only available for fixed-rate policies.");
  const rows = await db
    .select({ employee: insurancePolicyEmployees.employee })
    .from(insurancePolicyEmployees)
    .where(eq(insurancePolicyEmployees.policyId, policyId))
    .orderBy(asc(insurancePolicyEmployees.employee));
  return rows.map(({ employee }) => employee);
}

export async function checkInsurancePolicyCoverage(policyIdValue: number, employeeNameValue: string) {
  const policyId = requiredId(policyIdValue, "Insurance policy");
  if (typeof employeeNameValue !== "string") throw new Error("Employee name must be text.");
  const employeeName = normalizeEmployeeName(employeeNameValue);
  const [policy] = await db
    .select({
      type: insurancePolicies.type,
      status: insurancePolicies.status,
    })
    .from(insurancePolicies)
    .where(eq(insurancePolicies.id, policyId));
  if (!policy) throw new Error("Insurance policy not found.");

  let statusReason: "SUS" | "TER" | "COV" | null = null;
  if (policy.status === "SUSP") statusReason = "SUS";
  else if (policy.status === "TERM") statusReason = "TER";
  else if (policy.type === "FIX") {
    const coveredEmployees = await db
      .select({ employee: insurancePolicyEmployees.employee })
      .from(insurancePolicyEmployees)
      .where(eq(insurancePolicyEmployees.policyId, policyId));
    if (!coveredEmployees.some(({ employee }) => normalizeEmployeeName(employee) === employeeName)) {
      statusReason = "COV";
    }
  }
  return { status: statusReason ? "RJC" as const : "PRG" as const, statusReason };
}

export async function createInsurancePolicy(input: NewInsurancePolicy) {
  await validateInsuranceCompany(input.insuranceCompanyId);
  validatePolicyStatus(input.status);
  validatePolicyType(input.type);
  const now = new Date();
  const [record] = await db
    .insert(insurancePolicies)
    .values({ ...input, creationDate: input.creationDate ?? now, lastUpdated: now })
    .returning();
  return record;
}

export async function updateInsurancePolicy(id: number, input: InsurancePolicy) {
  await validateInsuranceCompany(input.insuranceCompanyId);
  validatePolicyStatus(input.status);
  validatePolicyType(input.type);
  const [existing] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id));
  if (!existing) return null;
  const changed = existing.policyNumber !== input.policyNumber ||
    existing.clientCompany !== input.clientCompany ||
    existing.clientActivity !== input.clientActivity ||
    existing.clientAddress !== input.clientAddress ||
    existing.clientCity !== input.clientCity ||
    existing.type !== input.type ||
    existing.effectiveDate.getTime() !== input.effectiveDate.getTime() ||
    existing.status !== input.status ||
    existing.insuranceCompanyId !== input.insuranceCompanyId;
  const [record] = await db
    .update(insurancePolicies)
    .set({
      policyNumber: input.policyNumber,
      clientCompany: input.clientCompany,
      clientActivity: input.clientActivity,
      clientAddress: input.clientAddress,
      clientCity: input.clientCity,
      type: input.type,
      effectiveDate: input.effectiveDate,
      status: input.status,
      insuranceCompanyId: input.insuranceCompanyId,
      ...(changed ? { lastUpdated: new Date() } : {}),
    })
    .where(eq(insurancePolicies.id, id))
    .returning();
  return record ?? null;
}

export async function deleteInsurancePolicy(id: number) {
  const [record] = await db
    .delete(insurancePolicies)
    .where(eq(insurancePolicies.id, id))
    .returning();
  return record ?? null;
}

function validatePolicyStatus(status: string) {
  if (status !== "VALI" && status !== "SUSP" && status !== "TERM") {
    throw new Error("Invalid insurance policy status.");
  }
}

function validatePolicyType(type: string) {
  if (type !== "REV" && type !== "FIX") throw new Error("Invalid insurance policy type.");
}

function requiredId(value: unknown, label: string) {
  const number = typeof value === "number"
    ? value
    : typeof value === "string" && /^\d+$/.test(value)
      ? Number(value)
      : Number.NaN;
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}

async function validateInsuranceCompany(insuranceCompanyId: number) {
  const [company] = await db
    .select()
    .from(insuranceProviders)
    .where(eq(insuranceProviders.id, insuranceCompanyId));
  if (!company) throw new Error("Invalid insurance company.");
}
