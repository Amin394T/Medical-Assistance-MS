"use server";

import { eq, inArray, like } from "drizzle-orm";

import { db } from "../index";
import { insurancePolicies, insuranceProviders, medicalRecords, serviceProviders } from "../schemas";
import type { MedicalRecord, NewMedicalRecord } from "../schemas";

export type MedicalRecordListItem = MedicalRecord & {
  policyNumber: string;
  clientCompany: string;
  insuranceCompany: string;
  intermediary: string | null;
  recordFate: "Approved" | "Rejected";
  fateReason: string | null;
};

export type CreateMedicalRecordFromCallInput = {
  accidentDate: string;
  policyId: number;
  recordType: "AT" | "MD" | "VF" | "SS" | "PR";
  reporterFirstName: string;
  reporterLastName: string;
  reporterPhone: string;
  accidentPlace: "WS" | "RT" | "OF" | "CS";
  accidentCause: "FALL" | "EQIP" | "FATG" | "HAZD" | "VIOL" | "OBJC" | "";
  victimFirstName: string;
  victimLastName: string;
  victimNationalId: string;
  victimPhone: string;
  victimJob: string;
};

export async function listMedicalRecords(): Promise<MedicalRecordListItem[]> {
  const rows = await db
    .select()
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id));

  const intermediaryIds = [...new Set(rows.flatMap(({ insurance_policies }) => insurance_policies.intermediateId ?? []))];
  const intermediaries = intermediaryIds.length
    ? await db.select().from(insuranceProviders).where(inArray(insuranceProviders.id, intermediaryIds))
    : [];
  const intermediaryLabels = new Map(intermediaries.map(({ id, label }) => [id, label]));

  return rows.map(({ medical_records, insurance_policies, insurance_providers }) => {
    const valid = isPolicyValidAt(insurance_policies, medical_records.accidentDate);

    return {
      ...medical_records,
      policyNumber: insurance_policies.policyNumber,
      clientCompany: insurance_policies.clientCompany,
      insuranceCompany: insurance_providers.label,
      intermediary: insurance_policies.intermediateId === null ? null : intermediaryLabels.get(insurance_policies.intermediateId) ?? null,
      recordFate: valid ? "Approved" as const : "Rejected" as const,
      fateReason: valid ? null : "The selected policy was not valid on the accident date.",
    };
  });
}

function isPolicyValidAt(policy: typeof insurancePolicies.$inferSelect, accidentDate: Date) {
  const incidentTime = accidentDate.getTime();
  const effectiveTime = policy.effectiveDate.getTime();
  const terminationTime = policy.terminationDate?.getTime();
  return effectiveTime <= incidentTime && (!policy.terminated || (terminationTime !== undefined && terminationTime > incidentTime));
}

export async function getMedicalRecord(id: number) {
  const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
  return record ?? null;
}

export async function getMedicalRecordDetails(id: number) {
  const [row] = await db
    .select()
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceProviders, eq(insurancePolicies.insuranceCompanyId, insuranceProviders.id))
    .where(eq(medicalRecords.id, id));
  if (!row) return null;

  const [intermediary] = row.insurance_policies.intermediateId === null
    ? []
    : await db.select({ label: insuranceProviders.label }).from(insuranceProviders).where(eq(insuranceProviders.id, row.insurance_policies.intermediateId));
  const [regulator] = row.medical_records.regulatorId === null
    ? []
    : await db.select({ label: serviceProviders.label }).from(serviceProviders).where(eq(serviceProviders.id, row.medical_records.regulatorId));
  const valid = isPolicyValidAt(row.insurance_policies, row.medical_records.accidentDate);

  return {
    ...row.medical_records,
    policyNumber: row.insurance_policies.policyNumber,
    clientCompany: row.insurance_policies.clientCompany,
    insuranceCompany: row.insurance_providers.label,
    intermediary: intermediary?.label ?? null,
    regulatorLabel: regulator?.label ?? null,
    recordFate: valid ? "Approved" as const : "Rejected" as const,
    fateReason: valid ? null : "The selected policy was not valid on the accident date.",
  };
}

export async function createMedicalRecord(input: NewMedicalRecord) {
  const [record] = await db.insert(medicalRecords).values(input).returning();
  return record;
}

export async function createMedicalRecordFromCall(input: CreateMedicalRecordFromCallInput) {
  const now = new Date();
  if (!input.policyId || !input.reporterFirstName.trim() || !input.reporterPhone.trim() || !input.victimFirstName.trim() || !input.victimLastName.trim() || !input.victimNationalId.trim()) {
    throw new Error("Complete all required record, reporter, and victim fields.");
  }
  const [policy] = await db
    .select()
    .from(insurancePolicies)
    .where(eq(insurancePolicies.id, input.policyId));

  if (!policy) {
    throw new Error("The selected insurance policy could not be found.");
  }

  const accidentDate = new Date(input.accidentDate);
  if (Number.isNaN(accidentDate.getTime())) {
    throw new Error("The accident date is invalid.");
  }

  const datePart = input.accidentDate.slice(0, 10).replaceAll("-", "");
  const referencePrefix = `${input.recordType}${datePart}`;
  const existingReferences = await db
    .select({ reference: medicalRecords.reference })
    .from(medicalRecords)
    .where(like(medicalRecords.reference, `${referencePrefix}%`));
  const nextSequence = existingReferences.reduce((highest, record) => {
    const sequence = Number(record.reference.slice(-2));
    return Number.isNaN(sequence) ? highest : Math.max(highest, sequence);
  }, 0) + 1;
  if (nextSequence > 99) throw new Error("The daily reference sequence is full for this record type.");

  const [record] = await db
    .insert(medicalRecords)
    .values({
      reference: `${referencePrefix}${String(nextSequence).padStart(2, "0")}`,
      accidentDate,
      policyId: input.policyId,
      recordType: input.recordType,
      reportingDate: now,
      reporterFirstName: input.reporterFirstName.trim(),
      reporterLastName: input.reporterLastName.trim() || null,
      reporterPhone: input.reporterPhone.trim(),
      accidentPlace: input.accidentPlace,
      victimFirstName: input.victimFirstName.trim(),
      victimLastName: input.victimLastName.trim(),
      victimNationalId: input.victimNationalId.trim(),
      victimPhone: input.victimPhone.trim() || null,
      accidentCause: input.accidentCause || null,
      victimJob: input.victimJob.trim() || null,
      lastAction: now,
    })
    .returning();

  return record;
}

export async function updateMedicalRecord(id: number, input: Partial<NewMedicalRecord>) {
  const [record] = await db
    .update(medicalRecords)
    .set({ ...input, lastAction: new Date() })
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
