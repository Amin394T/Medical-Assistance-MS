"use server";

import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../index";
import { insurancePolicies, insuranceProviders } from "../schemas";
import type { NewInsurancePolicy, InsurancePolicy } from "../schemas";

export async function listInsurancePolicies() {
  const insuranceCompanyAlias = alias(insuranceProviders, "insuranceCompany");
  const intermediaryAlias = alias(insuranceProviders, "intermediary");

  const rows = await db
    .select()
    .from(insurancePolicies)
    .innerJoin(insuranceCompanyAlias, eq(insurancePolicies.insuranceCompanyId, insuranceCompanyAlias.id))
    .leftJoin(intermediaryAlias, eq(insurancePolicies.intermediaryId, intermediaryAlias.id))
    .orderBy(desc(insurancePolicies.createdAt));

  return rows.map(({ insurance_policies, insuranceCompany, intermediary }) => ({
    ...insurance_policies,
    nominativeList: insurance_policies.nominativeList?.split(",") ?? [],
    insuranceCompany: insuranceCompany.label,
    intermediary: intermediary ? intermediary.label : null,
  }));
}

export async function createInsurancePolicy(input: NewInsurancePolicy) {
  await validatePolicyProviders(input.insuranceCompanyId, input.intermediaryId ?? null);
  const [record] = await db
    .insert(insurancePolicies)
    .values(input)
    .returning();
  return record;
}

export async function updateInsurancePolicy(id: number, input: InsurancePolicy) {
  await validatePolicyProviders(input.insuranceCompanyId, input.intermediaryId);  
  const [record] = await db
    .update(insurancePolicies)
    .set(input)
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

async function validatePolicyProviders(insuranceCompanyId: number, intermediaryId: number | null) {
  const [company] = await db
    .select()
    .from(insuranceProviders)
    .where(eq(insuranceProviders.id, insuranceCompanyId));
  if (company?.type !== "CMP") throw new Error("Invalid Insurance Company");

  if (intermediaryId !== null) {
    const [intermediary] = await db
      .select()
      .from(insuranceProviders)
      .where(eq(insuranceProviders.id, intermediaryId));
    if (intermediary?.type !== "AGT" && intermediary?.type !== "BRK") throw new Error("Invalid Intermediary");
  }
}

// TODO: adapt create and update to delta file processing