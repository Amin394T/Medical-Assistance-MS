import type { MedicalRecord } from "@/db/schemas/medicalRecords";

export function formatMedicalRecordReference(
  type: MedicalRecord["accidentType"],
  reference: number | string,
) {
  const value = String(reference);
  return `${type}-${value.slice(0, -2)}-${value.slice(-2)}`;
}