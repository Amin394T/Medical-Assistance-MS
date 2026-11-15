export type MedicalRecordFilters = {
  policyNumber: string;
  clientCompany: string;
  referenceNumber: string;
  victimName: string;
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
  | "accidentDate"
  | "status"
  | "manager";

export type MedicalRecordListOptions = {
  page?: number;
  pageSize?: number;
  filters?: MedicalRecordFilters;
  sort?: MedicalRecordSortKey;
  sortDesc?: boolean;
};
