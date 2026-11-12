"use server";

import { and, desc, eq, gte, isNotNull, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../index";
import { insurancePolicies, insurancePolicyEmployees, insuranceProviders, medicalRecords } from "../schemas";
import type { NewMedicalRecord, SetMedicalRecord } from "../schemas";

export async function listMedicalRecords() {
  const insuranceCompany = alias(insuranceProviders, "insuranceCompany");
  const intermediary = alias(insuranceProviders, "intermediary");
  const rows = await db
    .select({
      id: medicalRecords.id,
      reference: medicalRecords.reference,
      type: medicalRecords.accidentType,
      policyId: medicalRecords.policyId,
      policy: insurancePolicies.policyNumber,
      clientCompany: insurancePolicies.clientCompany,
      insuranceCompany: insuranceCompany.label,
      intermediary: intermediary.label,
      victimNameFirst: medicalRecords.victimFirstName,
      victimNameLast: medicalRecords.victimLastName,
      accidentDate: medicalRecords.accidentDate,
      status: medicalRecords.status,
      manager: medicalRecords.manager,
      lastUpdated: medicalRecords.lastUpdated,
      lastUpdater: medicalRecords.lastUpdater,
    })
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceCompanyId, insuranceCompany.id))
    .leftJoin(intermediary, eq(insurancePolicies.intermediaryId, intermediary.id))
    .orderBy(desc(medicalRecords.accidentDate));

  return rows.map((row) => ({
    ...row,
    victimName: [row.victimNameFirst, row.victimNameLast].filter(Boolean).join(" "),
    status: getRecordStatusLabel(row.status),
  }));
}

export async function getMedicalRecord(id: number) {
  const insuranceCompany = alias(insuranceProviders, "insuranceCompany");
  const intermediary = alias(insuranceProviders, "intermediary");
  const [row] = await db
    .select()
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceCompanyId, insuranceCompany.id))
    .leftJoin(intermediary, eq(insurancePolicies.intermediaryId, intermediary.id))
    .where(eq(medicalRecords.id, id));

  if (!row) return null;

  return {
    ...row.medical_records,
    policyNumber: row.insurance_policies.policyNumber,
    clientCompany: row.insurance_policies.clientCompany,
    insuranceCompany: row.insuranceCompany.label,
    intermediary: row.intermediary?.label ?? null,
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
  return db.transaction((tx) => {
    const [coverage] = tx
      .select({
        type: insurancePolicies.type,
        status: insurancePolicies.status,
      })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.id, input.policyId))
      .all();
    if (!coverage) throw new Error("Insurance policy not found.");

    const coveredEmployees = coverage.type === "FIX" && coverage.status === "VALI"
      ? tx.select({ employee: insurancePolicyEmployees.employee })
        .from(insurancePolicyEmployees)
        .where(eq(insurancePolicyEmployees.policyId, input.policyId))
        .all()
        .map(({ employee }) => employee)
      : [];
    const statusReason = getPolicyStatusReason(coverage.type, coverage.status, input.victimNationalId, coveredEmployees);

    const firstReference = Number(getCompactDate(input.accidentDate)) * 100;
    const lastReference = firstReference + 99;
    const [previousReference] = tx
      .select({ reference: medicalRecords.reference })
      .from(medicalRecords)
      .where(and(
        gte(medicalRecords.reference, firstReference),
        lte(medicalRecords.reference, lastReference),
      ))
      .orderBy(desc(medicalRecords.reference))
      .limit(1)
      .all();
    const reference = (previousReference?.reference ?? firstReference) + 1;
    if (reference > lastReference) throw new Error("The daily medical-record reference limit has been reached.");

    const now = new Date();
    const [record] = tx
      .insert(medicalRecords)
      .values({
        ...input,
        reference,
        status: statusReason ? "RJC" : "PRG",
        statusReason,
        manager: "USER",
        lastUpdated: now,
        lastUpdater: "USER",
      })
      .returning()
      .all();
    if (!record) throw new Error("The medical record could not be created.");
    return record;
  });
}

export async function updateMedicalRecord(id: number, input: SetMedicalRecord) {
  if (input.statusReason !== null && input.statusReason !== "SUS" && input.statusReason !== "TER" && input.statusReason !== "COV") {
    throw new Error("Invalid medical-record status reason.");
  }
  return db.transaction((tx) => {
    const [policy] = tx
      .select({
        type: insurancePolicies.type,
        status: insurancePolicies.status,
      })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.id, input.policyId))
      .all();
    if (!policy) throw new Error("Insurance policy not found.");

    const coveredEmployees = input.status === "RJC" && policy.type === "FIX" && policy.status === "VALI"
      ? tx.select({ employee: insurancePolicyEmployees.employee })
        .from(insurancePolicyEmployees)
        .where(eq(insurancePolicyEmployees.policyId, input.policyId))
        .all()
        .map(({ employee }) => employee)
      : [];
    const calculatedReason = input.status === "RJC"
      ? getPolicyStatusReason(policy.type, policy.status, input.victimNationalId, coveredEmployees)
      : null;
    const [record] = tx
      .update(medicalRecords)
      .set({
        ...input,
        statusReason: input.status === "RJC" ? input.statusReason ?? calculatedReason : null,
        lastUpdated: new Date(),
        lastUpdater: "USER",
      })
      .where(eq(medicalRecords.id, id))
      .returning()
      .all();
    return record ?? null;
  });
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
    case "PRG": return "In Progress";
    case "DSP": return "Disputed";
    case "RJC": return "Rejected";
    case "CLS": return "Closed";
    case "ABN": return "Abandoned";
    default: return status;
  }
}

function getCompactDate(date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function getPolicyStatusReason(type: "REV" | "FIX", status: "VALI" | "SUSP" | "TERM", employeeId: string, employees: string[]) {
  if (status === "SUSP") return "SUS" as const;
  if (status === "TERM") return "TER" as const;
  if (type !== "FIX") return null;

  const normalizedEmployeeId = normalizeEmployeeId(employeeId);
  return employees.some((employee) => normalizeEmployeeId(employee) === normalizedEmployeeId)
    ? null
    : "COV" as const;
}

function normalizeEmployeeId(value: string) {
  return value.trim().toLowerCase();
}
