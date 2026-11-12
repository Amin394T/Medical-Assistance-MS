"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { eq, inArray } from "drizzle-orm";

import { db } from "../index";
import { insurancePolicies, insurancePolicyEmployees, insuranceProviders } from "../schemas";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type PolicyStatus = "VALI" | "SUSP" | "TERM";
type PolicyType = "REV" | "FIX";

type PolicyDeltaRow = {
  rowNumber: number;
  policyNumber: string;
  clientCompany: string;
  clientActivity: string | null;
  clientAddress: string | null;
  clientCity: string | null;
  insurer: string | null;
  type: PolicyType;
  effectiveDate: Date;
  intermediary: string | null;
  status: PolicyStatus;
};

type EmployeeDeltaRow = {
  rowNumber: number;
  policyNumber: string;
  employee: string;
};

export type PolicyDeltaImportResult = {
  policiesCreated: number;
  statusesUpdated: number;
  unchangedPolicies: number;
  coveredEmployeesReplaced: number;
};

export async function uploadPolicyDeltaFiles(formData: FormData): Promise<PolicyDeltaImportResult> {
  const insuranceCompanyId = requiredId(formData.get("insuranceCompanyId"), "Insurance company");
  const policyFile = formData.get("policyFile");
  const employeeFile = formData.get("employeeFile");
  if (!(policyFile instanceof File)) throw new Error("Choose an Excel policy delta file.");
  if (!(employeeFile instanceof File)) throw new Error("Choose an Excel covered-employee file.");

  const [policyWorksheet, employeeWorksheet] = await Promise.all([
    readWorksheet(policyFile, "policy delta"),
    readWorksheet(employeeFile, "covered-employee"),
  ]);
  const policyRows = parsePolicyDeltaRows(policyWorksheet);
  const employeeRows = parseEmployeeDeltaRows(employeeWorksheet);
  if (policyRows.length === 0) throw new Error("The policy workbook does not contain any policy rows.");

  return db.transaction((tx) => {
    const [company] = tx
      .select()
      .from(insuranceProviders)
      .where(eq(insuranceProviders.id, insuranceCompanyId))
      .all();
    if (company?.type !== "CMP") throw new Error("Select a valid insurance company.");

    const providers = tx.select().from(insuranceProviders).all();
    const providersByLabel = new Map(providers.map((provider) => [normalize(provider.label), provider]));
    const policies = tx.select().from(insurancePolicies).all();
    const policiesByNumber = new Map(policies.map((policy) => [normalize(policy.policyNumber), policy]));
    let policiesCreated = 0;
    let statusesUpdated = 0;
    let unchangedPolicies = 0;

    for (const row of policyRows) {
      if (row.insurer && normalize(row.insurer) !== normalize(company.label)) {
        throw new Error(`Row ${row.rowNumber}: insurer "${row.insurer}" does not match the selected insurance company.`);
      }
      const current = policiesByNumber.get(normalize(row.policyNumber));
      if (current && current.insuranceCompanyId !== insuranceCompanyId) {
        throw new Error(`Row ${row.rowNumber}: policy "${row.policyNumber}" belongs to a different insurance company.`);
      }

      const intermediary = row.intermediary ? providersByLabel.get(normalize(row.intermediary)) : null;
      if (row.intermediary && intermediary?.type !== "AGT" && intermediary?.type !== "BRK") {
        throw new Error(`Row ${row.rowNumber}: intermediary "${row.intermediary}" is not a known agent or broker.`);
      }

      if (!current) {
        const now = new Date();
        const [created] = tx.insert(insurancePolicies).values({
          policyNumber: row.policyNumber,
          clientCompany: row.clientCompany,
          clientActivity: row.clientActivity,
          clientAddress: row.clientAddress,
          clientCity: row.clientCity,
          type: row.type,
          effectiveDate: row.effectiveDate,
          insuranceCompanyId,
          intermediaryId: intermediary?.id ?? null,
          status: row.status,
          creationDate: now,
          lastUpdated: now,
        }).returning().all();
        if (!created) throw new Error(`Row ${row.rowNumber}: the policy could not be created.`);
        policiesByNumber.set(normalize(created.policyNumber), created);
        policiesCreated += 1;
      } else if (current.status !== row.status) {
        const [updated] = tx.update(insurancePolicies)
          .set({ status: row.status, lastUpdated: new Date() })
          .where(eq(insurancePolicies.id, current.id))
          .returning()
          .all();
        if (!updated) throw new Error(`Row ${row.rowNumber}: the policy status could not be updated.`);
        policiesByNumber.set(normalize(updated.policyNumber), updated);
        statusesUpdated += 1;
      } else {
        unchangedPolicies += 1;
      }
    }

    const employeesByPolicy = new Map<number, Map<string, string>>();
    for (const row of employeeRows) {
      const policy = policiesByNumber.get(normalize(row.policyNumber));
      if (!policy || policy.insuranceCompanyId !== insuranceCompanyId || policy.type !== "FIX") {
        throw new Error(`Row ${row.rowNumber}: policy "${row.policyNumber}" is not a fixed-rate policy for the selected company.`);
      }
      const employees = employeesByPolicy.get(policy.id) ?? new Map<string, string>();
      const employeeKey = normalize(row.employee);
      if (employees.has(employeeKey)) throw new Error(`Row ${row.rowNumber}: employee "${row.employee}" is duplicated for this policy.`);
      employees.set(employeeKey, row.employee);
      employeesByPolicy.set(policy.id, employees);
    }

    const fixedPolicyIds = [...policiesByNumber.values()]
      .filter((policy) => policy.insuranceCompanyId === insuranceCompanyId && policy.type === "FIX")
      .map((policy) => policy.id);
    if (fixedPolicyIds.length) {
      tx.delete(insurancePolicyEmployees)
        .where(inArray(insurancePolicyEmployees.policyId, fixedPolicyIds))
        .run();
    }

    const employeeRecords = [...employeesByPolicy].flatMap(([policyId, employees]) =>
      [...employees.values()].map((employee) => ({ policyId, employee })),
    );
    if (employeeRecords.length) tx.insert(insurancePolicyEmployees).values(employeeRecords).run();

    return {
      policiesCreated,
      statusesUpdated,
      unchangedPolicies,
      coveredEmployeesReplaced: employeeRecords.length,
    };
  });
}

async function readWorksheet(file: File, label: string) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error(`The ${label} file must be an .xlsx workbook.`);
  if (file.size === 0) throw new Error(`The ${label} workbook is empty.`);
  if (file.size > MAX_FILE_SIZE) throw new Error(`The ${label} workbook must be 5 MB or smaller.`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from([Buffer.from(await file.arrayBuffer())]));
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error(`The ${label} workbook does not contain a worksheet.`);
  return worksheet;
}

function parsePolicyDeltaRows(worksheet: ExcelJS.Worksheet): PolicyDeltaRow[] {
  const headers = getHeaders(worksheet);
  for (const header of ["policy", "client", "type", "effective date", "status"]) {
    if (!headers.has(header)) throw new Error(`The policy workbook is missing the required "${header}" column.`);
  }

  const rows: PolicyDeltaRow[] = [];
  const seenPolicies = new Set<string>();
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!row.hasValues) continue;
    const value = (header: string) => cellText(row, headers, header);
    const policyNumber = value("policy");
    const clientCompany = value("client");
    const effectiveDate = parseEffectiveDate(row, headers.get("effective date")!, rowNumber);
    const type = parsePolicyType(value("type"), rowNumber);
    const status = parsePolicyStatus(value("status"), rowNumber);
    const intermediary = value("intermediary") || null;
    for (const [label, field] of [["policy", policyNumber], ["client", clientCompany]] as const) {
      if (!field) throw new Error(`Row ${rowNumber}: "${label}" is required.`);
    }
    const key = normalize(policyNumber);
    if (seenPolicies.has(key)) throw new Error(`Row ${rowNumber}: policy "${policyNumber}" appears more than once.`);
    seenPolicies.add(key);
    rows.push({
      rowNumber,
      policyNumber,
      clientCompany,
      clientActivity: value("client activity") || null,
      clientAddress: value("client address") || null,
      clientCity: value("client city") || null,
      insurer: value("insurer") || null,
      type,
      effectiveDate,
      intermediary,
      status,
    });
  }
  return rows;
}

function parseEmployeeDeltaRows(worksheet: ExcelJS.Worksheet): EmployeeDeltaRow[] {
  const headers = getHeaders(worksheet);
  for (const header of ["policy", "employee"]) {
    if (!headers.has(header)) throw new Error(`The covered-employee workbook is missing the required "${header}" column.`);
  }

  const rows: EmployeeDeltaRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!row.hasValues) continue;
    const policyNumber = cellText(row, headers, "policy");
    const employee = cellText(row, headers, "employee");
    if (!policyNumber || !employee) throw new Error(`Row ${rowNumber}: both "policy" and "employee" are required.`);
    rows.push({ rowNumber, policyNumber, employee });
  }
  return rows;
}

function getHeaders(worksheet: ExcelJS.Worksheet) {
  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    const header = canonicalHeader(cell.text);
    if (!header) return;
    if (headers.has(header)) throw new Error(`The workbook contains a duplicate "${header}" column.`);
    headers.set(header, columnNumber);
  });
  return headers;
}

function canonicalHeader(value: string) {
  const header = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  switch (header) {
    case "policy number": return "policy";
    case "client company": return "client";
    case "policy type": return "type";
    case "insurance company": return "insurer";
    case "employee id":
    case "employee number": return "employee";
    default: return header;
  }
}

function cellText(row: ExcelJS.Row, headers: Map<string, number>, header: string) {
  const columnNumber = headers.get(header);
  return columnNumber === undefined ? "" : row.getCell(columnNumber).text.trim();
}

function parseEffectiveDate(row: ExcelJS.Row, columnNumber: number, rowNumber: number) {
  const value = row.getCell(columnNumber).value;
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * DAY_IN_MILLISECONDS);
  } else if (typeof value === "string" && value.trim()) {
    date = new Date(value.trim());
  } else {
    throw new Error(`Row ${rowNumber}: "effective date" must be a valid Excel date.`);
  }
  if (Number.isNaN(date.getTime())) throw new Error(`Row ${rowNumber}: "effective date" must be a valid Excel date.`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parsePolicyType(value: string, rowNumber: number): PolicyType {
  switch (value.trim().toUpperCase().replace(/[\s_-]+/g, "")) {
    case "REV":
    case "REVISABLE": return "REV";
    case "FIX":
    case "FIXEDRATE": return "FIX";
    default: throw new Error(`Row ${rowNumber}: type must be REVISABLE or FIXED-RATE.`);
  }
}

function parsePolicyStatus(value: string, rowNumber: number): PolicyStatus {
  switch (value.trim().toUpperCase()) {
    case "VALI":
    case "VALID": return "VALI";
    case "SUSP":
    case "SUSPENDED": return "SUSP";
    case "TERM":
    case "TERMINATED": return "TERM";
    default: throw new Error(`Row ${rowNumber}: status must be VALID, SUSPENDED, or TERMINATED.`);
  }
}

function requiredId(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is required.`);
  return number;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
