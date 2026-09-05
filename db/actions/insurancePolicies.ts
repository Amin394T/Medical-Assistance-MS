"use server";

import { eq } from "drizzle-orm";

import { db } from "../index";
import { insuranceClients, insurancePolicies, insuranceProviders } from "../schemas";
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
    .innerJoin(insuranceClients, eq(insurancePolicies.clientCompanyId, insuranceClients.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id));

  return rows.map(({ insurance_policies, insurance_clients, insurance_providers }) => ({
    ...insurance_policies,
    clientCompanyLabel: insurance_clients.label,
    insuranceCompanyLabel: insurance_providers.label,
    intermediateLabel: null,
  })) satisfies InsurancePolicyListItem[];
}

export async function getInsurancePolicy(id: number) {
  const [record] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id));
  return record ?? null;
}

export async function createInsurancePolicy(input: NewInsurancePolicy) {
  const [record] = await db.insert(insurancePolicies).values(input).returning();
  return record;
}

export async function updateInsurancePolicy(id: number, input: Partial<NewInsurancePolicy>) {
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
