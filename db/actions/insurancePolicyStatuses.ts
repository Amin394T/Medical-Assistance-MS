"use server";

import { desc, eq } from "drizzle-orm";

import { db } from "../index";
import { insurancePolicies, insurancePolicyStatuses } from "../schemas";
import type { InsurancePolicyStatus, NewInsurancePolicyStatus } from "../schemas";

export async function listInsurancePolicyStatuses() {
  return db
    .select({
      id: insurancePolicyStatuses.id,
      policyId: insurancePolicyStatuses.policyId,
      policyNumber: insurancePolicies.policyNumber,
      clientCompany: insurancePolicies.clientCompany,
      status: insurancePolicyStatuses.status,
      effectiveDate: insurancePolicyStatuses.effectiveDate,
      updateDate: insurancePolicyStatuses.updateDate,
      cancelled: insurancePolicyStatuses.cancelled,
    })
    .from(insurancePolicyStatuses)
    .innerJoin(insurancePolicies, eq(insurancePolicyStatuses.policyId, insurancePolicies.id))
    .orderBy(desc(insurancePolicyStatuses.effectiveDate), desc(insurancePolicyStatuses.updateDate));
}

export async function createInsurancePolicyStatus(input: NewInsurancePolicyStatus) {
  validatePolicyStatus(input);
  const [record] = await db
    .insert(insurancePolicyStatuses)
    .values(input)
    .returning();
  return record;
}

export async function updateInsurancePolicyStatus(id: number, input: InsurancePolicyStatus) {
  validatePolicyStatus(input);
  const [record] = await db
    .update(insurancePolicyStatuses)
    .set(input)
    .where(eq(insurancePolicyStatuses.id, id))
    .returning();
  return record ?? null;
}

export async function deleteInsurancePolicyStatus(id: number) {
  const [record] = await db
    .delete(insurancePolicyStatuses)
    .where(eq(insurancePolicyStatuses.id, id))
    .returning();
  return record ?? null;
}

function validatePolicyStatus(input: Pick<InsurancePolicyStatus, "policyId" | "status" | "effectiveDate">) {
  if (!Number.isInteger(input.policyId) || input.policyId < 1) throw new Error("Insurance policy is required.");
  if (input.status !== "VALID" && input.status !== "SSPD" && input.status !== "TRMN") {
    throw new Error("Invalid insurance policy status.");
  }
  if (!(input.effectiveDate instanceof Date) || Number.isNaN(input.effectiveDate.getTime())) {
    throw new Error("Effective date is required.");
  }
}
