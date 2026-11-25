import type { GridListOptions } from "./gridListTypes";

export type MedicalRecordFilters = {
  policyNumber: string;
  clientCompany: string;
  referenceNumber: string;
  victimName: string;
  victimNationalId: string;
  recordStatus: string;
  accidentFrom: string;
  accidentTo: string;
};

export type MedicalRecordSortKey =
  | "reference"
  | "policy"
  | "clientCompany"
  | "insuranceCompany"
  | "victimName"
  | "victimNationalId"
  | "accidentDate"
  | "status"
  | "manager";

export type MedicalRecordListOptions = Omit<GridListOptions, "search"> & {
  filters?: MedicalRecordFilters;
  sort?: MedicalRecordSortKey;
};
