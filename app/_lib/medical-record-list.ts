import { listMedicalRecords } from "@/db/actions/medicalRecords";
import type { MedicalRecordFilters, MedicalRecordSortKey } from "@/db/actions/medicalRecordListTypes";
import { getGridListQuery } from "@/app/_lib/grid-list-query";

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
  const query = await getGridListQuery(searchParams, "accidentDate");
  const filters: MedicalRecordFilters = {
    policyNumber: getParam(params.policyNumber),
    clientCompany: getParam(params.clientCompany),
    referenceNumber: getParam(params.referenceNumber),
    victimName: getParam(params.victimName),
    recordStatus: getParam(params.recordStatus),
    accidentFrom: getParam(params.accidentFrom),
    accidentTo: getParam(params.accidentTo),
  };
  const sort = isMedicalRecordSortKey(query.sort) ? query.sort : "accidentDate";
  const result = await listMedicalRecords({ page: query.page, filters, sort, sortDesc: query.sortDesc });
  return { ...result, filters, sort, sortDesc: query.sortDesc };
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isMedicalRecordSortKey(value: string): value is MedicalRecordSortKey {
  return SORT_KEYS.some((key) => key === value);
}
