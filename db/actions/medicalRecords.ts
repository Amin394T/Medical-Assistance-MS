"use server";

import { desc, eq, isNotNull, like } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { revalidatePath } from "next/cache";

import { db } from "../index";
import { insurancePolicies, insuranceProviders, medicalRecords } from "../schemas";
import type { NewMedicalRecord, SetMedicalRecord, InsurancePolicy } from "../schemas";

export async function listMedicalRecords() {
  const rows = await db
    .select({
      reference: medicalRecords.reference,
      policy: insurancePolicies.policyNumber,
      clientCompany: insurancePolicies.clientCompany,
      insuranceCompany: insuranceProviders.label,
      victimNameFirst: medicalRecords.victimFirstName,
      victimNameLast: medicalRecords.victimLastName,
      accidentDate: medicalRecords.accidentDate,
      status: medicalRecords.status,
      manager: medicalRecords.managedBy,
    })
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id));

  return rows.map((row) => ({
    ...row,
    victimName: row.victimNameFirst + " " + row.victimNameLast,
    status: getRecordStatusLabel(row.status),
  }));
}

export async function getMedicalRecord(id: number) {
  const insuranceCompanyAlias = alias(insuranceProviders, "insuranceCompany");
  const intermediaryAlias = alias(insuranceProviders, "intermediary");

  const [row] = await db
    .select()
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceCompanyAlias, eq(insurancePolicies.insuranceCompanyId, insuranceCompanyAlias.id))
    .leftJoin(intermediaryAlias, eq(insurancePolicies.intermediaryId, intermediaryAlias.id))
    .where(eq(medicalRecords.id, id));

  return {
    ...row.medical_records,
    policyNumber: row.insurance_policies.policyNumber,
    clientCompany: row.insurance_policies.clientCompany,
    insuranceCompany: row.insuranceCompany.label,
    intermediary: row.intermediary ? row.intermediary.label : null,
  };
}

export async function listJobs() {
  const rows = await db
    .selectDistinct({ job: medicalRecords.victimJob })
    .from(medicalRecords)
    .where(isNotNull(medicalRecords.victimJob));
  return rows.map(({ job }) => job);
}

export async function createMedicalRecord(input: NewMedicalRecord) {
  const [policy] = await db
    .select()
    .from(insurancePolicies)
    .where(eq(insurancePolicies.id, input.policyId));
  if (!policy) {
    throw new Error("Insurance Policy Not Found");
  }

  const referenceDate = getCompactDate(input.reportingDate);
  const [prevReference] = await db
    .select({ reference: medicalRecords.reference })
    .from(medicalRecords)
    .where(like(medicalRecords.reference, `${referenceDate}%`))
    .orderBy(desc(medicalRecords.reference))
    .limit(1);
  const nextReference: number = prevReference ? prevReference.reference + 1 : Number(referenceDate) * 100 + 1;

  const fate = getPolicyValidityStatus(policy, input.accidentDate, `${input.victimFirstName} ${input.victimLastName}`);

  const [record] = await db
    .insert(medicalRecords)
    .values({
      ...input,
      reference: nextReference,
      fate: fate ? "REJECTED" : "APPROVED",
      fateReason: fate,
    })
    .returning();
  return record;
}

export async function updateMedicalRecord(id: number, input: SetMedicalRecord) {
  const [record] = await db
    .update(medicalRecords)
    .set(input)
    .where(eq(medicalRecords.id, id))
    .returning();

  revalidatePath("/assistance/records/details");
  return record ?? null;
}

export async function deleteMedicalRecord(id: number) {
  const [record] = await db
    .delete(medicalRecords)
    .where(eq(medicalRecords.id, id))
    .returning();

  return record ?? null;
}

function getRecordStatusLabel(status: SetMedicalRecord["status"]) {
  switch (status) {
    case "PROG": return "In Progress";
    case "SETT": return "Settled";
    case "CLOS": return "Closed";
    case "ABAN": return "Abandoned";
    case "BILL": return "Billed";
    default: return status;
  }
}

function getPolicyValidityStatus(policy: InsurancePolicy, accidentDate: Date, victimName: string) {
  if (policy.terminated) return "Policy Terminated";
  if (accidentDate < policy.effectiveDate) return "Policy Expired";
  if (policy.nominativeList && victimName) {
    const nominativeList = policy.nominativeList.split(",").map((name) => name.trim().toLowerCase());
    if (!nominativeList.includes(victimName.trim().toLowerCase())) return "Victim Not Covered";
  }
  // TODO: add remaining checks

  return null;
}

function getCompactDate(date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// TODO: revalidate record fate
// TODO: get distinct victim jobs