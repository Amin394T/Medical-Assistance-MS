"use server";

import { eq, inArray } from "drizzle-orm";

import { db } from "../index";
import { insurancePolicies, insuranceProviders } from "../schemas";
import type { InsurancePolicy, NewInsurancePolicy } from "../schemas";

export type InsurancePolicyListItem = InsurancePolicy & {
  clientCompanyLabel: string;
  insuranceCompanyLabel: string;
  intermediateLabel: string | null;
};

export async function listInsurancePolicies() {
  const rows = await db
    .select()
    .from(insurancePolicies)
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id));
  const intermediaryIds = [...new Set(rows.flatMap(({ insurance_policies }) => insurance_policies.intermediateId ?? []))];
  const intermediaries = intermediaryIds.length
    ? await db.select().from(insuranceProviders).where(inArray(insuranceProviders.id, intermediaryIds))
    : [];
  const intermediaryLabels = new Map(intermediaries.map(({ id, label }) => [id, label]));

  return rows.map(({ insurance_policies, insurance_providers }) => ({
    ...insurance_policies,
    clientCompanyLabel: insurance_policies.clientCompany,
    insuranceCompanyLabel: insurance_providers.label,
    intermediateLabel: insurance_policies.intermediateId === null ? null : intermediaryLabels.get(insurance_policies.intermediateId) ?? null,
  })) satisfies InsurancePolicyListItem[];
}

export async function getInsurancePolicy(id: number) {
  const [record] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id));
  return record ?? null;
}

export async function createInsurancePolicy(input: NewInsurancePolicy) {
  await validatePolicyProviders(input.insuranceCompanyId, input.intermediateId ?? null);
  const now = new Date();
  const [record] = await db.insert(insurancePolicies).values({ ...input, createdAt: now, updatedAt: now }).returning();
  return record;
}

export async function updateInsurancePolicy(id: number, input: Partial<NewInsurancePolicy>) {
  const [current] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id));
  if (!current) return null;
  await validatePolicyProviders(input.insuranceCompanyId ?? current.insuranceCompanyId, input.intermediateId === undefined ? current.intermediateId : input.intermediateId);
  const changes = { ...input };
  delete changes.createdAt;
  delete changes.updatedAt;
  const [record] = await db
    .update(insurancePolicies)
    .set({ ...changes, updatedAt: new Date() })
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

async function validatePolicyProviders(insuranceCompanyId: number, intermediateId: number | null) {
  const [company] = await db.select().from(insuranceProviders).where(eq(insuranceProviders.id, insuranceCompanyId));
  if (company?.type !== "CMP") throw new Error("The insurance company must be a company provider.");

  if (intermediateId !== null) {
    const [intermediary] = await db.select().from(insuranceProviders).where(eq(insuranceProviders.id, intermediateId));
    if (intermediary?.type !== "AGT" && intermediary?.type !== "BRK") {
      throw new Error("The intermediary must be an agent or broker.");
    }
  }
}
