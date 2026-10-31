"use server";

import { and, desc, eq, gte, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../index";
import { insurancePolicies, insuranceProviders, insurancePolicyStatuses, medicalRecords } from "../schemas";
import type { NewMedicalRecord, SetMedicalRecord } from "../schemas";

export async function listMedicalRecords() {
  const rows = await db
    .select({
      id: medicalRecords.id,
      reference: medicalRecords.reference,
      type: medicalRecords.type,
      policyId: medicalRecords.policyId,
      policy: insurancePolicies.policyNumber,
      clientCompany: insurancePolicies.clientCompany,
      insuranceCompany: insuranceProviders.label,
      victimNameFirst: medicalRecords.victimFirstName,
      victimNameLast: medicalRecords.victimLastName,
      accidentDate: medicalRecords.accidentDate,
      status: medicalRecords.status,
      manager: medicalRecords.managedBy,
      openingDate: medicalRecords.openingDate,
      lastModified: medicalRecords.lastModified,
    })
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id));

  const statuses = rows.length
    ? await db
      .select()
      .from(insurancePolicyStatuses)
      .where(and(
        inArray(insurancePolicyStatuses.policyId, [...new Set(rows.map(({ policyId }) => policyId))]),
        or(eq(insurancePolicyStatuses.cancelled, false), isNull(insurancePolicyStatuses.cancelled)),
      ))
    : [];

  return rows.map((row) => ({
    ...row,
    victimName: [row.victimNameFirst, row.victimNameLast].filter(Boolean).join(" "),
    status: getRecordStatusLabel(row.status),
    createdAt: row.openingDate,
    updatedAt: row.lastModified,
    fate: inferPolicyFate(statuses, row.policyId, row.accidentDate),
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

  if (!row) return null;

  const statuses = await db
    .select()
    .from(insurancePolicyStatuses)
    .where(and(
      eq(insurancePolicyStatuses.policyId, row.insurance_policies.id),
      or(eq(insurancePolicyStatuses.cancelled, false), isNull(insurancePolicyStatuses.cancelled)),
    ));

  return {
    ...row.medical_records,
    createdAt: row.medical_records.openingDate,
    updatedAt: row.medical_records.lastModified,
    fate: inferPolicyFate(statuses, row.insurance_policies.id, row.medical_records.accidentDate),
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
  if (!policy) throw new Error("Insurance Policy Not Found");

  const referenceDate = getCompactDate(input.accidentDate);
  const firstReference = Number(referenceDate) * 100;
  const lastReference = firstReference + 99;
  const [prevReference] = await db
    .select({ reference: medicalRecords.reference })
    .from(medicalRecords)
    .where(and(gte(medicalRecords.reference, firstReference), lte(medicalRecords.reference, lastReference)))
    .orderBy(desc(medicalRecords.reference))
    .limit(1);
  const nextReference = (prevReference?.reference ?? firstReference) + 1;
  if (nextReference > lastReference) throw new Error("The daily medical-record reference limit has been reached.");

  const [record] = await db
    .insert(medicalRecords)
    .values({
      ...input,
      reference: nextReference,
      openingDate: new Date(),
      lastModified: new Date(),
    })
    .returning();
  return record;
}

export async function updateMedicalRecord(id: number, input: SetMedicalRecord) {
  const [record] = await db
    .update(medicalRecords)
    .set({
      ...input,
      lastModified: new Date(),
    })
    .where(eq(medicalRecords.id, id))
    .returning();
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
    case "CLOS": return "Closed";
    case "ABAN": return "Abandoned";
    default: return status;
  }
}

function getCompactDate(date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function inferPolicyFate(
  statuses: { policyId: number; status: "VALID" | "SSPD" | "TRMN"; effectiveDate: Date; updateDate: Date; cancelled: boolean | null }[],
  policyId: number,
  accidentDate: Date,
) {
  const latestStatus = statuses
    .filter((status) => status.policyId === policyId && status.effectiveDate <= accidentDate && !status.cancelled)
    .sort((left, right) => right.effectiveDate.getTime() - left.effectiveDate.getTime() || right.updateDate.getTime() - left.updateDate.getTime())[0];

  return latestStatus === undefined || latestStatus.status === "VALID";
}
