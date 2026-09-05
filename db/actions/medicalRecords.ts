"use server";

import { and, desc, eq, like, lte } from "drizzle-orm";

import { db } from "../index";
import { insuranceClients, insurancePolicies, medicalRecords } from "../schemas";
import type { MedicalRecord, NewMedicalRecord } from "../schemas";

export type MedicalRecordListItem = MedicalRecord & {
  policyNumber: string;
  clientCompany: string;
};

export type CreateMedicalRecordFromCallInput = {
  accidentDate: string;
  clientCompanyId: number;
  recordType: "normal" | "verification";
  reporterFirstName: string;
  reporterLastName: string;
  reporterPhone: string;
  accidentType: "initial" | "relapse" | "sickness" | "";
  initialAccidentId: number | null;
  accidentPlace: "workshop" | "route" | "office" | "site";
  victimFirstName: string;
  victimLastName: string;
  victimNationalId: string;
  victimPhone: string;
  accidentCause:
    | "falling or slipping"
    | "machine or equipment"
    | "overexertion and fatigue"
    | "hazardous substance"
    | "workplace violence"
    | "moving objects"
    | "";
};

export async function listMedicalRecords(): Promise<MedicalRecordListItem[]> {
  const rows = await db
    .select()
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceClients, eq(medicalRecords.clientCompanyId, insuranceClients.id));

  return rows.map(({ medical_records, insurance_policies, insurance_clients }) => ({
    ...medical_records,
    policyNumber: insurance_policies.policyNumber,
    clientCompany: insurance_clients.label,
  }));
}

export async function getMedicalRecord(id: number) {
  const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
  return record ?? null;
}

export async function createMedicalRecord(input: NewMedicalRecord) {
  const [record] = await db.insert(medicalRecords).values(input).returning();
  return record;
}

export async function createMedicalRecordFromCall(input: CreateMedicalRecordFromCallInput) {
  const now = new Date();
  const [policy] = await db
    .select()
    .from(insurancePolicies)
    .where(
      and(
      eq(insurancePolicies.clientCompanyId, input.clientCompanyId),
      eq(insurancePolicies.terminated, false),
      lte(insurancePolicies.effectiveDate, now),
      ),
    )
    .orderBy(desc(insurancePolicies.effectiveDate))
    .limit(1);

  if (!policy) {
    throw new Error("No active insurance policy was found for this client.");
  }

  if (input.accidentType === "relapse" && !input.initialAccidentId) {
    throw new Error("A previous medical record is required for a relapse.");
  }

  const accidentDate = new Date(`${input.accidentDate}T12:00:00`);
  if (Number.isNaN(accidentDate.getTime())) {
    throw new Error("The accident date is invalid.");
  }

  const datePart = input.accidentDate.replaceAll("-", "").slice(2);
  const referencePrefix = `AT/${datePart}/`;
  const existingReferences = await db
    .select({ referenceNumber: medicalRecords.referenceNumber })
    .from(medicalRecords)
    .where(like(medicalRecords.referenceNumber, `${referencePrefix}%`));
  const nextSequence = existingReferences.reduce((highest, record) => {
    const sequence = Number(record.referenceNumber.split("/").at(-1));
    return Number.isNaN(sequence) ? highest : Math.max(highest, sequence);
  }, 0) + 1;

  const [record] = await db
    .insert(medicalRecords)
    .values({
      accidentDate,
      policyId: policy.id,
      insuranceCompanyId: policy.insuranceCompanyId,
      referenceNumber: `${referencePrefix}${String(nextSequence).padStart(3, "0")}`,
      clientCompanyId: input.clientCompanyId,
      recordType: input.recordType,
      reportingDate: now,
      reporterFirstName: input.reporterFirstName.trim(),
      reporterLastName: input.reporterLastName.trim() || null,
      reporterPhone: input.reporterPhone.trim(),
      accidentType: input.accidentType || null,
      initialAccidentId: input.initialAccidentId,
      accidentPlace: input.accidentPlace,
      victimFirstName: input.victimFirstName.trim(),
      victimLastName: input.victimLastName.trim(),
      victimNationalId: input.victimNationalId.trim(),
      victimPhone: input.victimPhone.trim() || null,
      accidentCause: input.accidentCause || null,
      recordStatus: "in progress",
      recordFate: "waiting",
      managedBy: "Admin User",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return record;
}

export async function updateMedicalRecord(id: number, input: Partial<NewMedicalRecord>) {
  const [record] = await db
    .update(medicalRecords)
    .set(input)
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
