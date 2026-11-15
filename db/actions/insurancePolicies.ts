"use server";

import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../index";
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
