"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { db } from "../index";
import { insurancePolicies, insurancePolicyStatuses, insuranceProviders } from "../schemas";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type DeltaStatus = "VALID" | "SSPD" | "TRMN";

type PolicyDeltaRow = {
  rowNumber: number;
  policyNumber: string;
  clientCompany: string;
  effectiveDate: Date;
  insurer: string;
  intermediary: string | null;
  status: DeltaStatus;
};

export type PolicyDeltaImportResult = {
  policiesCreated: number;
  statusEntriesAdded: number;
  unchangedPolicies: number;
};

export async function uploadPolicyDeltaFile(formData: FormData): Promise<PolicyDeltaImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Choose an Excel policy delta file.");
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("The policy delta file must be an .xlsx workbook.");
  if (file.size === 0) throw new Error("The selected workbook is empty.");
  if (file.size > MAX_FILE_SIZE) throw new Error("The policy delta workbook must be 5 MB or smaller.");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from([Buffer.from(await file.arrayBuffer())]));
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("The workbook does not contain a worksheet.");

  const rows = parsePolicyDeltaRows(worksheet);
  if (rows.length === 0) throw new Error("The workbook does not contain any policy rows.");

  return db.transaction((tx) => {
    const providers = tx.select().from(insuranceProviders).all();
    const providersByLabel = new Map(providers.map((provider) => [normalize(provider.label), provider]));
    const policies = tx.select().from(insurancePolicies).all();
    const policiesByNumber = new Map<string, (typeof policies)[number][]>();
    for (const policy of policies) {
      const key = normalize(policy.policyNumber);
      const matches = policiesByNumber.get(key) ?? [];
      matches.push(policy);
      policiesByNumber.set(key, matches);
    }
    const statuses = tx.select().from(insurancePolicyStatuses).all();
    const statusesByPolicy = new Map<number, typeof statuses>();
    for (const status of statuses) {
      const current = statusesByPolicy.get(status.policyId) ?? [];
      current.push(status);
      statusesByPolicy.set(status.policyId, current);
    }

    let policiesCreated = 0;
    let statusEntriesAdded = 0;
    let unchangedPolicies = 0;

    for (const row of rows) {
      const matches = policiesByNumber.get(normalize(row.policyNumber)) ?? [];
      if (matches.length > 1) {
        throw new Error(`Row ${row.rowNumber}: policy "${row.policyNumber}" matches more than one existing policy.`);
      }

      let policy = matches[0];
      const now = new Date();

      if (!policy) {
        const insurer = providersByLabel.get(normalize(row.insurer));
        if (insurer?.type !== "CMP") {
          throw new Error(`Row ${row.rowNumber}: insurer "${row.insurer}" is not a known insurance company.`);
        }

        const intermediary = row.intermediary ? providersByLabel.get(normalize(row.intermediary)) : null;
        if (row.intermediary && intermediary?.type !== "AGT" && intermediary?.type !== "BRK") {
          throw new Error(`Row ${row.rowNumber}: intermediary "${row.intermediary}" is not a known agent or broker.`);
        }

        const [createdPolicy] = tx.insert(insurancePolicies).values({
          policyNumber: row.policyNumber,
          clientCompany: row.clientCompany,
          effectiveDate: row.effectiveDate,
          insuranceCompanyId: insurer.id,
          intermediaryId: intermediary?.id ?? null,
          type: "REV",
          creationDate: now,
          lastModified: now,
        }).returning().all();

        policy = createdPolicy;
        policiesByNumber.set(normalize(policy.policyNumber), [policy]);
        policiesCreated += 1;
      }

      const latestStatus = (statusesByPolicy.get(policy.id) ?? [])
        .filter((status) => status.cancelled !== true)
        .sort((left, right) =>
          right.effectiveDate.getTime() - left.effectiveDate.getTime()
          || right.updateDate.getTime() - left.updateDate.getTime())[0];
      const currentStatus = latestStatus?.status ?? "VALID";

      if (currentStatus === row.status) {
        unchangedPolicies += 1;
        continue;
      }

      const [createdStatus] = tx.insert(insurancePolicyStatuses).values({
        policyId: policy.id,
        status: row.status,
        effectiveDate: row.effectiveDate,
        updateDate: now,
        cancelled: false,
      }).returning().all();

      const current = statusesByPolicy.get(policy.id) ?? [];
      current.push(createdStatus);
      statusesByPolicy.set(policy.id, current);
      statusEntriesAdded += 1;
    }

    return { policiesCreated, statusEntriesAdded, unchangedPolicies };
  });
}

function parsePolicyDeltaRows(worksheet: ExcelJS.Worksheet): PolicyDeltaRow[] {
  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    const header = cell.text.trim().toLowerCase();
    if (!header) return;
    if (headers.has(header)) throw new Error(`The workbook contains a duplicate "${header}" column.`);
    headers.set(header, columnNumber);
  });

  for (const header of ["policy", "client", "effective date", "insurer", "status"]) {
    if (!headers.has(header)) throw new Error(`The workbook is missing the required "${header}" column.`);
  }

  const rows: PolicyDeltaRow[] = [];
  const seenPolicies = new Set<string>();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const value = (header: string) => {
      const columnNumber = headers.get(header);
      return columnNumber === undefined ? "" : row.getCell(columnNumber).text.trim();
    };

    if (!row.hasValues) continue;

    const policyNumber = value("policy");
    const clientCompany = value("client");
    const insurer = value("insurer");
    const intermediary = value("intermediary") || null;
    const rawStatus = value("status").toUpperCase();
    const effectiveDate = parseEffectiveDate(row, headers.get("effective date")!, rowNumber);
    const status = parseStatus(rawStatus, rowNumber);

    for (const [label, field] of [
      ["policy", policyNumber],
      ["client", clientCompany],
      ["insurer", insurer],
    ] as const) {
      if (!field) throw new Error(`Row ${rowNumber}: "${label}" is required.`);
    }

    const policyKey = normalize(policyNumber);
    if (seenPolicies.has(policyKey)) throw new Error(`Row ${rowNumber}: policy "${policyNumber}" appears more than once.`);
    seenPolicies.add(policyKey);

    rows.push({ rowNumber, policyNumber, clientCompany, effectiveDate, insurer, intermediary, status });
  }

  return rows;
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

function parseStatus(value: string, rowNumber: number): DeltaStatus {
  switch (value) {
    case "VALID": return "VALID";
    case "SUSPENDED": return "SSPD";
    case "TERMINATED": return "TRMN";
    default: throw new Error(`Row ${rowNumber}: status must be VALID, SUSPENDED, or TERMINATED.`);
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
