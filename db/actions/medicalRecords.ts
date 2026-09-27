"use server";

import { and, eq, inArray, like, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export type UpdateMedicalRecordState = { error: string; success: string };

export async function updateMedicalRecordFromDetails(id: number, _previousState: UpdateMedicalRecordState, formData: FormData): Promise<UpdateMedicalRecordState> {
  try {
  const [current] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
  if (!current) throw new Error("The medical record could not be found.");

  const recordType = readEnum(formData, "recordType", ["AT", "MD", "VF", "SS", "PR"] as const, "record type");
  const accidentPlace = readEnum(formData, "accidentPlace", ["WS", "RT", "OF", "CS"] as const, "accident place");
  const accidentEvolution = readEnum(formData, "accidentEvolution", ["INIT", "DELG", "RELP", "DEAT", "COMP"] as const, "accident evolution");
  const recordStatus = readEnum(formData, "recordStatus", ["PROG", "SETT", "CLOS", "ABAN", "BILL"] as const, "record status");
  const accidentCause = readEnum(formData, "accidentCause", ["", "FALL", "EQIP", "FATG", "HAZD", "VIOL", "OBJC"] as const, "accident cause");
  const policyId = readPositiveInteger(formData, "policyId", "insurance policy");
  const [policy] = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, policyId));
  if (!policy) throw new Error("Select a valid insurance policy.");

  const reportingDate = parseDateTime(readString(formData, "reportingDate"), "reporting date");
  const accidentDateText = readString(formData, "accidentDate");
  const accidentDate = parseDateTime(accidentDateText, "accident date");
  const delegationDateText = readString(formData, "delegationDate");
  const delegationDate = delegationDateText ? parseDateTime(delegationDateText, "delegation date") : null;
  const coverageDateText = readString(formData, "coverageDate");
  const coverageDate = coverageDateText ? parseDateTime(`${coverageDateText}T00:00:00`, "coverage date") : null;
  const coverageIssuedValue = readString(formData, "coverageIssued");
  if (coverageIssuedValue !== "" && coverageIssuedValue !== "true" && coverageIssuedValue !== "false") {
    throw new Error("Select a valid coverage-issued value.");
  }

  const regulatorText = readString(formData, "regulatorId");
  const regulatorId = regulatorText ? Number(regulatorText) : null;
  if (regulatorId !== null) {
    if (!Number.isInteger(regulatorId) || regulatorId < 1) throw new Error("Select a valid regulator.");
    const [regulator] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, regulatorId));
    if (!regulator || regulator.profile !== "REGULATOR") throw new Error("Select a valid regulator.");
  }

  const reporterFirstName = readRequiredString(formData, "reporterFirstName", "reporter first name");
  const reporterPhone = readRequiredString(formData, "reporterPhone", "reporter phone");
  const victimFirstName = readRequiredString(formData, "victimFirstName", "victim first name");
  const victimLastName = readRequiredString(formData, "victimLastName", "victim last name");
  const victimNationalId = readRequiredString(formData, "victimNationalId", "victim national ID");

  const referencePrefix = `${recordType}${accidentDateText.slice(0, 10).replaceAll("-", "")}`;
  let reference = current.reference;
  if (!reference.startsWith(referencePrefix)) {
    const existingReferences = await db
      .select({ reference: medicalRecords.reference })
      .from(medicalRecords)
      .where(and(like(medicalRecords.reference, `${referencePrefix}%`), ne(medicalRecords.id, id)));
    const nextSequence = existingReferences.reduce((highest, record) => {
      const sequence = Number(record.reference.slice(-2));
      return Number.isNaN(sequence) ? highest : Math.max(highest, sequence);
    }, 0) + 1;
    if (nextSequence > 99) throw new Error("The daily reference sequence is full for this record type.");
    reference = `${referencePrefix}${String(nextSequence).padStart(2, "0")}`;
  }

  await db
    .update(medicalRecords)
    .set({
      reference,
      recordType,
      policyId,
      reportingDate,
      reporterFirstName,
      reporterLastName: readString(formData, "reporterLastName") || null,
      reporterPhone,
      accidentPlace,
      accidentDate,
      accidentCause: accidentCause || null,
      victimFirstName,
      victimLastName,
      victimPhone: readString(formData, "victimPhone") || null,
      victimNationalId,
      victimJob: readString(formData, "victimJob") || null,
      accidentEvolution,
      delegationDate,
      coverageIssued: coverageIssuedValue === "" ? null : coverageIssuedValue === "true",
      coverageDate,
      regulatorId,
      recordStatus,
      observation: readString(formData, "observation") || null,
      lastAction: new Date(),
    })
    .where(eq(medicalRecords.id, id));

  revalidatePath("/assistance/records");
  revalidatePath("/assistance/records/details");
  return { error: "", success: "Record updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update the medical record." , success: "" };
  }
}

function readString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readRequiredString(formData: FormData, name: string, label: string) {
  const value = readString(formData, name);
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function readPositiveInteger(formData: FormData, name: string, label: string) {
  const value = Number(readString(formData, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(`Select a valid ${label}.`);
  return value;
}

function readEnum<const T extends readonly string[]>(formData: FormData, name: string, values: T, label: string): T[number] {
  const value = readString(formData, name);
  if (!values.includes(value)) throw new Error(`Select a valid ${label}.`);
  return value;
}

function parseDateTime(value: string, label: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new Error(`Enter a valid ${label}.`);
  return date;
}

export async function deleteMedicalRecord(id: number) {
  const [record] = await db
    .delete(medicalRecords)
    .where(eq(medicalRecords.id, id))
    .returning();

  return record ?? null;
}
