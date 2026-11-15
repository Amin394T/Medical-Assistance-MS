import { listMedicalRecords } from "@/db/actions/medicalRecords";
import type { MedicalRecordFilters, MedicalRecordSortKey } from "@/db/actions/medicalRecordListTypes";

type SearchParams = Record<string, string | string[] | undefined>;

const SORT_KEYS: MedicalRecordSortKey[] = [
  "reference",
  "policy",
  "clientCompany",
  "insuranceCompany",
  "victimName",
  "accidentDate",
  "status",
  "manager",
];

export async function loadMedicalRecordList(searchParams: Promise<SearchParams>) {
  const params = await searchParams;
  const filters: MedicalRecordFilters = {
    policyNumber: getParam(params.policyNumber),
    clientCompany: getParam(params.clientCompany),
    referenceNumber: getParam(params.referenceNumber),
    victimName: getParam(params.victimName),
    recordStatus: getParam(params.recordStatus),
    accidentFrom: getParam(params.accidentFrom),
    accidentTo: getParam(params.accidentTo),
  };
  const requestedSort = getParam(params.sort);
  const sort = isMedicalRecordSortKey(requestedSort) ? requestedSort : "accidentDate";
  const sortDesc = getParam(params.direction) !== "asc";
  const parsedPage = Number(getParam(params.page));
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const result = await listMedicalRecords({ page, filters, sort, sortDesc });
  return { ...result, filters, sort, sortDesc };
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isMedicalRecordSortKey(value: string): value is MedicalRecordSortKey {
  return SORT_KEYS.some((key) => key === value);
}
