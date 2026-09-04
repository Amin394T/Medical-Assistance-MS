import { listMedicalRecords } from "@/db/actions/medicalRecords";
import { MedicalRecordsTable } from "@/app/_components/medical-records-table";

export const dynamic = "force-dynamic";

export default async function Home() {
  const records = await listMedicalRecords();

  return <MedicalRecordsTable records={records} />;
}
