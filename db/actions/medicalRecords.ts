"use server";

import { and, asc, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../index";
import { getGridPage } from "./gridList";
import { insurancePolicies, insuranceCoverages, insuranceProviders, medicalRecords } from "../schemas";
import type { NewMedicalRecord, SetMedicalRecord } from "../schemas";
import type { MedicalRecordListOptions, MedicalRecordSortKey } from "./medicalRecordListTypes";
import { normalizeEmployeeName } from "./policyEmployeeNames";

export async function listMedicalRecords(options: MedicalRecordListOptions = {}) {
  const insuranceCompany = alias(insuranceProviders, "insuranceCompany");
  const filters = options.filters;
  const conditions = [];
  const policyFilter = filters?.policyNumber.trim();
  const companyFilter = filters?.clientCompany.trim();
  const referenceFilter = filters?.referenceNumber.trim();
  const victimFilter = filters?.victimName.trim();
  const nationalIdFilter = filters?.victimNationalId.trim();
  if (policyFilter) {
    conditions.push(sql`instr(lower(${insurancePolicies.policyNumber}), lower(${policyFilter})) > 0`);
  }
  if (companyFilter) {
    conditions.push(sql`instr(lower(${insurancePolicies.clientCompany}), lower(${companyFilter})) > 0`);
  }
  if (referenceFilter) {
    const formattedReference = sql`upper(${medicalRecords.accidentType} || '-' || substr(printf('%08d', ${medicalRecords.reference}), 1, 6) || '-' || substr(printf('%08d', ${medicalRecords.reference}), 7, 2))`;
    conditions.push(sql`instr(${formattedReference}, upper(${referenceFilter})) > 0`);
  }
  if (victimFilter) {
    const victimName = sql`coalesce(${medicalRecords.victimFirstName}, '') || ' ' || coalesce(${medicalRecords.victimLastName}, '')`;
    conditions.push(sql`instr(lower(${victimName}), lower(${victimFilter})) > 0`);
  }
  if (nationalIdFilter) {
    conditions.push(sql`instr(lower(coalesce(${medicalRecords.victimNationalId}, '')), lower(${nationalIdFilter})) > 0`);
  }
  const status = getRecordStatusCode(filters?.recordStatus);
  if (status) conditions.push(eq(medicalRecords.status, status));
  const accidentFrom = parseDateBoundary(filters?.accidentFrom, "00:00:00");
  const accidentTo = parseDateBoundary(filters?.accidentTo, "23:59:59.999");
  if (accidentFrom) conditions.push(gte(medicalRecords.accidentDate, accidentFrom));
  if (accidentTo) conditions.push(lte(medicalRecords.accidentDate, accidentTo));
  const condition = and(...conditions);

  const [countRow] = await db
    .select({ total: count() })
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceProviderId, insuranceCompany.id))
    .where(condition);
  const totalCount = countRow?.total ?? 0;
  const { page, pageSize, offset } = getGridPage(totalCount, options);
  const sort = isMedicalRecordSortKey(options.sort) ? options.sort : "accidentDate";
  const sortColumn = getMedicalRecordSortColumn(sort, insuranceCompany);
  const orderBy = options.sortDesc === false ? asc(sortColumn) : desc(sortColumn);
  const rows = await db
    .select({
      id: medicalRecords.id,
      reference: medicalRecords.reference,
      type: medicalRecords.accidentType,
      policyId: medicalRecords.policyId,
      policy: insurancePolicies.policyNumber,
      clientCompany: insurancePolicies.clientCompany,
      insuranceCompany: insuranceCompany.label,
      victimNameFirst: medicalRecords.victimFirstName,
      victimNameLast: medicalRecords.victimLastName,
      victimNationalId: medicalRecords.victimNationalId,
      accidentDate: medicalRecords.accidentDate,
      status: medicalRecords.status,
      manager: medicalRecords.manager,
      lastUpdated: medicalRecords.lastUpdated,
      lastUpdater: medicalRecords.lastUpdater,
    })
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceProviderId, insuranceCompany.id))
    .where(condition)
    .orderBy(orderBy, asc(medicalRecords.id))
    .limit(pageSize)
    .offset(offset);

  return {
    records: rows.map((row) => ({
      ...row,
      victimName: [row.victimNameFirst, row.victimNameLast].filter(Boolean).join(" "),
      status: getRecordStatusLabel(row.status),
    })),
    totalCount,
    page,
    pageSize,
  };
}

export async function getMedicalRecord(id: number) {
  const insuranceCompany = alias(insuranceProviders, "insuranceCompany");
  const [row] = await db
    .select()
    .from(medicalRecords)
    .innerJoin(insurancePolicies, eq(medicalRecords.policyId, insurancePolicies.id))
    .innerJoin(insuranceCompany, eq(insurancePolicies.insuranceProviderId, insuranceCompany.id))
    .where(eq(medicalRecords.id, id));

  if (!row) return null;

  return {
    ...row.medical_records,
    policyNumber: row.insurance_policies.policyNumber,
    clientCompany: row.insurance_policies.clientCompany,
    insuranceCompany: row.insuranceCompany.label,
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

    const coveredEmployees = coverage.type === "NMT"
      ? tx.select({ employee: insuranceCoverages.employee })
        .from(insuranceCoverages)
        .where(eq(insuranceCoverages.policyId, input.policyId))
        .all()
        .map(({ employee }) => employee)
      : [];
    const statusReason = getPolicyStatusReason(
      coverage.type,
      coverage.status,
      [input.victimFirstName, input.victimLastName].filter(Boolean).join(" "),
      coveredEmployees,
    );

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
  if (input.statusReason !== null && input.statusReason !== "SPD" && input.statusReason !== "TRM" && input.statusReason !== "LMT") {
    throw new Error("Invalid medical-record status reason.");
  }
  return db.transaction((tx) => {
    const [existing] = tx
      .select({ policyId: medicalRecords.policyId })
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id))
      .all();
    if (!existing) return null;

    const [policy] = tx
      .select({
        type: insurancePolicies.type,
        status: insurancePolicies.status,
      })
      .from(insurancePolicies)
      .where(eq(insurancePolicies.id, existing.policyId))
      .all();
    if (!policy) throw new Error("The medical record's insurance policy was not found.");

    const coveredEmployees = input.status === "RJC" && policy.type === "NMT"
      ? tx.select({ employee: insuranceCoverages.employee })
        .from(insuranceCoverages)
        .where(eq(insuranceCoverages.policyId, existing.policyId))
        .all()
        .map(({ employee }) => employee)
      : [];
    const calculatedReason = input.status === "RJC"
      ? getPolicyStatusReason(
        policy.type,
        policy.status,
        [input.victimFirstName, input.victimLastName].filter(Boolean).join(" "),
        coveredEmployees,
      )
      : null;
    const [record] = tx
      .update(medicalRecords)
      .set({
        reportingDate: input.reportingDate,
        reporterName: input.reporterName,
        reporterPhone: input.reporterPhone,
        accidentDate: input.accidentDate,
        accidentType: input.accidentType,
        accidentPlace: input.accidentPlace,
        accidentCause: input.accidentCause,
        accidentEvolution: input.accidentEvolution,
        victimFirstName: input.victimFirstName,
        victimLastName: input.victimLastName,
        victimPhone: input.victimPhone,
        victimNationalId: input.victimNationalId,
        victimJob: input.victimJob,
        status: input.status,
        statusReason: input.status === "RJC" ? input.statusReason ?? calculatedReason : null,
        regulatoryDoctor: input.regulatoryDoctor,
        observation: input.observation,
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

function getRecordStatusCode(label: string | undefined) {
  switch (label) {
    case "In Progress": return "PRG" as const;
    case "Disputed": return "DSP" as const;
    case "Rejected": return "RJC" as const;
    case "Closed": return "CLS" as const;
    case "Abandoned": return "ABN" as const;
    default: return undefined;
  }
}

function isMedicalRecordSortKey(value: unknown): value is MedicalRecordSortKey {
  return value === "reference" || value === "policy" || value === "clientCompany" ||
    value === "insuranceCompany" || value === "victimName" || value === "victimNationalId" || value === "accidentDate" ||
    value === "status" || value === "manager";
}

function getMedicalRecordSortColumn(sort: MedicalRecordSortKey, insuranceCompany: ReturnType<typeof alias>) {
  const victimName = sql`coalesce(${medicalRecords.victimFirstName}, '') || ' ' || coalesce(${medicalRecords.victimLastName}, '')`;
  switch (sort) {
    case "reference": return medicalRecords.reference;
    case "policy": return insurancePolicies.policyNumber;
    case "clientCompany": return insurancePolicies.clientCompany;
    case "insuranceCompany": return insuranceCompany.label;
    case "victimName": return victimName;
    case "victimNationalId": return medicalRecords.victimNationalId;
    case "accidentDate": return medicalRecords.accidentDate;
    case "status": return sql`case ${medicalRecords.status}
      when 'PRG' then 'In Progress'
      when 'DSP' then 'Disputed'
      when 'RJC' then 'Rejected'
      when 'CLS' then 'Closed'
      when 'ABN' then 'Abandoned'
    end`;
    case "manager": return medicalRecords.manager;
  }
}

function parseDateBoundary(value: string | undefined, time: string) {
  if (!value) return null;
  const date = new Date(`${value}T${time}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCompactDate(date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function getPolicyStatusReason(type: "GLB" | "NMT", status: "VLD" | "SPD" | "TRM", employeeName: string, employees: string[]) {
  if (status === "SPD") return "SPD" as const;
  if (status === "TRM") return "TRM" as const;
  if (type !== "NMT") return null;

  const normalizedEmployeeName = normalizeEmployeeName(employeeName);
  return employees.some((employee) => normalizeEmployeeName(employee) === normalizedEmployeeName)
    ? null
    : "LMT" as const;
}
