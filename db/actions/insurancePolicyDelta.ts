"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { eq, inArray } from "drizzle-orm";

import { db } from "../index";
import { insurancePolicies, insuranceCoverages, insuranceProviders } from "../schemas";
import { normalizeEmployeeName } from "./policyEmployeeNames";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type PolicyStatus = "VLD" | "SPD" | "TRM";
type PolicyType = "GLB" | "NMT";

type PolicyDeltaRow = {
  rowNumber: number;
  policyNumber: string;
  clientCompany: string;
  clientActivity: string | null;
  clientAddress: string | null;
  clientCity: string | null;
  insurer: string | null;
  type: PolicyType | null;
  statusDate: Date;
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
  const insuranceProviderId = requiredId(formData.get("insuranceProviderId"), "Insurance provider");
  const policyFile = formData.get("policyFile");
  const employeeFileValue = formData.get("employeeFile");
  if (!(policyFile instanceof File)) throw new Error("Choose an Excel policy delta file.");
  if (employeeFileValue !== null && !(employeeFileValue instanceof File)) {
    throw new Error("Choose a valid Excel covered-employee file.");
  }
  const employeeFile = employeeFileValue instanceof File && employeeFileValue.size > 0
    ? employeeFileValue
    : null;

  const [policyWorksheet, employeeWorksheet] = await Promise.all([
    readWorksheet(policyFile, "policy delta"),
    employeeFile ? readWorksheet(employeeFile, "covered-employee") : Promise.resolve(null),
  ]);
  const policyRows = parsePolicyDeltaRows(policyWorksheet);
  const employeeRows = employeeWorksheet ? parseEmployeeDeltaRows(employeeWorksheet) : [];
  if (policyRows.length === 0) throw new Error("The policy workbook does not contain any policy rows.");

  return db.transaction((tx) => {
    const [company] = tx
      .select()
      .from(insuranceProviders)
      .where(eq(insuranceProviders.id, insuranceProviderId))
      .all();
    if (!company) throw new Error("Select a valid insurance company.");

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
      if (current && current.insuranceProviderId !== insuranceProviderId) {
        throw new Error(`Row ${row.rowNumber}: policy "${row.policyNumber}" belongs to a different insurance company.`);
      }

      if (!current) {
        const now = new Date();
        const rowType = row.type ?? (employeeRows.some((employee) => normalize(employee.policyNumber) === normalize(row.policyNumber)) ? "NMT" : "GLB");
        const [created] = tx.insert(insurancePolicies).values({
          policyNumber: row.policyNumber,
          clientCompany: row.clientCompany,
          clientActivity: row.clientActivity,
          clientAddress: row.clientAddress,
          clientCity: row.clientCity,
          type: rowType,
          statusDate: row.statusDate,
          insuranceProviderId,
          status: row.status,
          uploadDate: now,
        }).returning().all();
        if (!created) throw new Error(`Row ${row.rowNumber}: the policy could not be created.`);
        policiesByNumber.set(normalize(created.policyNumber), created);
        policiesCreated += 1;
      } else if (current.status !== row.status) {
        const [updated] = tx.update(insurancePolicies)
          .set({ status: row.status, statusDate: row.statusDate })
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
      if (!policy || policy.insuranceProviderId !== insuranceProviderId || policy.type !== "NMT") {
        throw new Error(`Row ${row.rowNumber}: policy "${row.policyNumber}" is not a fixed-rate policy for the selected company.`);
      }
      const employees = employeesByPolicy.get(policy.id) ?? new Map<string, string>();
      const employeeKey = normalizeEmployeeName(row.employee);
      if (employees.has(employeeKey)) throw new Error(`Row ${row.rowNumber}: employee "${row.employee}" is duplicated for this policy.`);
      employees.set(employeeKey, row.employee);
      employeesByPolicy.set(policy.id, employees);
    }

    const employeeRecords = [...employeesByPolicy].flatMap(([policyId, employees]) =>
      [...employees.values()].map((employee) => ({ policyId, employee })),
    );
    if (employeeFile) {
      const nominativePolicyIds = [...policiesByNumber.values()]
        .filter((policy) => policy.insuranceProviderId === insuranceProviderId && policy.type === "NMT")
        .map((policy) => policy.id);
      if (nominativePolicyIds.length) {
        tx        .delete(insuranceCoverages)
          .where(inArray(insuranceCoverages.policyId, nominativePolicyIds))
          .run();
      }
      if (employeeRecords.length) tx.insert(insuranceCoverages).values(employeeRecords).run();
    }

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
  for (const header of ["policy", "client", "status", "status date"]) {
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
    const statusDate = parseEffectiveDate(row, headers.get("status date")!, rowNumber);
    const type = headers.has("type") && value("type") ? parsePolicyType(value("type"), rowNumber) : null;
    const status = parsePolicyStatus(value("status"), rowNumber);
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
      statusDate,
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
    case "effective date": return "status date";
    case "insurance company": return "insurer";
    case "employee name":
    case "employee full name": return "employee";
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
    case "GLB":
    case "GLOBAL": return "GLB";
    case "NMT":
    case "NOMINATIVE": return "NMT";
    default: throw new Error(`Row ${rowNumber}: type must be GLOBAL or NOMINATIVE.`);
  }
}

function parsePolicyStatus(value: string, rowNumber: number): PolicyStatus {
  switch (value.trim().toUpperCase()) {
    case "VLD":
    case "VALID": return "VLD";
    case "SPD":
    case "SUSPENDED": return "SPD";
    case "TRM":
    case "TERMINATED": return "TRM";
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
