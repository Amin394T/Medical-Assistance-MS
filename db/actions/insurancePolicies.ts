"use server";

import { asc, count, desc, eq, or, sql } from "drizzle-orm";

import { db } from "../index";
import { getGridPage } from "./gridList";
import type { GridListOptions } from "./gridListTypes";
import { insuranceCoverages, insurancePolicies, insuranceProviders } from "../schemas";
import type { InsurancePolicy, NewInsurancePolicy } from "../schemas";
import { normalizeEmployeeName } from "./policyEmployeeNames";

export async function listInsurancePolicies() {
  const rows = await db.select().from(insurancePolicies)
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceProviderId, insuranceProviders.id))
    .orderBy(desc(insurancePolicies.statusDate));
  return rows.map(({ insurance_policies, insurance_providers }) => ({
    ...insurance_policies,
    insuranceProvider: insurance_providers.label,
    insuranceCompany: insurance_providers.label,
  }));
}

export async function listInsurancePoliciesPage(options: GridListOptions = {}) {
  const search = options.search?.trim() ?? "";
  const statusLabel = sql`case ${insurancePolicies.status} when 'VLD' then 'Valid' when 'SPD' then 'Suspended' when 'TRM' then 'Terminated' end`;
  const condition = search ? or(
    sql`instr(lower(${insurancePolicies.policyNumber}), lower(${search})) > 0`,
    sql`instr(lower(${insurancePolicies.clientCompany}), lower(${search})) > 0`,
    sql`instr(lower(${statusLabel}), lower(${search})) > 0`,
  ) : undefined;
  const [countRow] = await db.select({ total: count() }).from(insurancePolicies).where(condition);
  const totalCount = countRow?.total ?? 0;
  const { page, pageSize, offset } = getGridPage(totalCount, options);
  const sortDesc = options.sortDesc !== false;
  const rows = await db.select().from(insurancePolicies)
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceProviderId, insuranceProviders.id))
    .where(condition)
    .orderBy(sortDesc ? desc(insurancePolicies.statusDate) : asc(insurancePolicies.statusDate), asc(insurancePolicies.id))
    .limit(pageSize).offset(offset);
  return {
    rows: rows.map(({ insurance_policies, insurance_providers }) => ({
      ...insurance_policies,
      insuranceProvider: insurance_providers.label,
      insuranceCompany: insurance_providers.label,
    })),
    totalCount,
    page,
    pageSize,
    search,
    sort: "statusDate",
    sortDesc,
  };
}

export async function listInsurancePolicyEmployees(policyIdValue: number) {
  const policyId = requiredId(policyIdValue, "Insurance policy");
  const [policy] = await db.select({ type: insurancePolicies.type }).from(insurancePolicies).where(eq(insurancePolicies.id, policyId));
  if (!policy) throw new Error("Insurance policy not found.");
  if (policy.type !== "NMT") throw new Error("Covered employees are only available for nominative policies.");
  const rows = await db.select({ employee: insuranceCoverages.employee }).from(insuranceCoverages)
    .where(eq(insuranceCoverages.policyId, policyId)).orderBy(asc(insuranceCoverages.employee));
  return rows.map(({ employee }) => employee);
}

export async function checkInsurancePolicyCoverage(policyIdValue: number, employeeNameValue: string) {
  const policyId = requiredId(policyIdValue, "Insurance policy");
  if (typeof employeeNameValue !== "string") throw new Error("Employee name must be text.");
  const employeeName = normalizeEmployeeName(employeeNameValue);
  const [policy] = await db.select({ type: insurancePolicies.type, status: insurancePolicies.status })
    .from(insurancePolicies).where(eq(insurancePolicies.id, policyId));
  if (!policy) throw new Error("Insurance policy not found.");
  let statusReason: "SPD" | "TRM" | "LMT" | null = null;
  if (policy.status === "SPD") statusReason = "SPD";
  else if (policy.status === "TRM") statusReason = "TRM";
  else if (policy.type === "NMT") {
    const employees = await db.select({ employee: insuranceCoverages.employee }).from(insuranceCoverages)
      .where(eq(insuranceCoverages.policyId, policyId));
    if (!employees.some(({ employee }) => normalizeEmployeeName(employee) === employeeName)) statusReason = "LMT";
  }
  return { status: statusReason ? "RJC" as const : "PRG" as const, statusReason };
}

export async function createInsurancePolicy(input: NewInsurancePolicy) {
  validatePolicy(input);
  const [record] = await db.insert(insurancePolicies).values(input).returning();
  return record;
}

export async function updateInsurancePolicy(id: number, input: InsurancePolicy) {
  validatePolicy(input);
  const [record] = await db.update(insurancePolicies).set(input).where(eq(insurancePolicies.id, id)).returning();
  return record ?? null;
}

export async function deleteInsurancePolicy(id: number) {
  const [record] = await db.delete(insurancePolicies).where(eq(insurancePolicies.id, id)).returning();
  return record ?? null;
}

function validatePolicy(input: Pick<InsurancePolicy, "type" | "status">) {
  if (input.type !== "GLB" && input.type !== "NMT") throw new Error("Invalid insurance policy type.");
  if (input.status !== "VLD" && input.status !== "SPD" && input.status !== "TRM") throw new Error("Invalid insurance policy status.");
}

function requiredId(value: unknown, label: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new Error(`${label} is required.`);
  return id;
}
