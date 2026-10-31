"use server";

import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../index";
import { insurancePolicies, insuranceProviders } from "../schemas";
import type { InsurancePolicy, NewInsurancePolicy } from "../schemas";

export async function listInsurancePolicies() {
  const insuranceCompany = alias(insuranceProviders, "insuranceCompany");
  const intermediary = alias(insuranceProviders, "intermediary");
  const rows = await db
    .select()
    .from(insurancePolicies)
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceCompanyId, insuranceCompany.id))
    .leftJoin(intermediary, eq(insurancePolicies.intermediaryId, intermediary.id))
    .orderBy(desc(insurancePolicies.creationDate));

  return rows.map(({ insurance_policies, insuranceCompany, intermediary }) => ({
    ...insurance_policies,
    insuranceCompany: insuranceCompany.label,
    intermediary: intermediary?.label ?? null,
  }));
}

export async function createInsurancePolicy(input: NewInsurancePolicy) {
  await validatePolicyProviders(input.insuranceCompanyId, input.intermediaryId ?? null);
  validatePolicyStatus(input.status);
  const now = new Date();
  const [record] = await db
    .insert(insurancePolicies)
    .values({ ...input, creationDate: input.creationDate ?? now, lastUpdated: now })
    .returning();
  return record;
}

export async function updateInsurancePolicy(id: number, input: InsurancePolicy) {
  await validatePolicyProviders(input.insuranceCompanyId, input.intermediaryId ?? null);
  validatePolicyStatus(input.status);
  const [record] = await db
    .update(insurancePolicies)
    .set({
      policyNumber: input.policyNumber,
      clientCompany: input.clientCompany,
      effectiveDate: input.effectiveDate,
      status: input.status,
      insuranceCompanyId: input.insuranceCompanyId,
      intermediaryId: input.intermediaryId,
      lastUpdated: new Date(),
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
  if (status !== "VALI" && status !== "RESU" && status !== "SUSP" && status !== "TERM") {
    throw new Error("Invalid insurance policy status.");
  }
}

async function validatePolicyProviders(insuranceCompanyId: number, intermediaryId: number | null) {
  const [company] = await db
    .select()
    .from(insuranceProviders)
    .where(eq(insuranceProviders.id, insuranceCompanyId));
  if (company?.type !== "CMP") throw new Error("Invalid insurance company.");

  if (intermediaryId !== null) {
    const [intermediary] = await db
      .select()
      .from(insuranceProviders)
      .where(eq(insuranceProviders.id, intermediaryId));
    if (intermediary?.type !== "AGT" && intermediary?.type !== "BRK") throw new Error("Invalid intermediary.");
  }
}
