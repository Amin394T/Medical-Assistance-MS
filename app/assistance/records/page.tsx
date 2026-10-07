import { ClipboardList } from "lucide-react";

import { listMedicalRecords } from "@/db/actions/medicalRecords";
import { MedicalRecordsTable } from "@/app/_components/medical-records-table";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function Records() {
  const records = await listMedicalRecords();

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Assistance" title="Medical Records" icon={<ClipboardList className="h-6 w-6" />} />
        <MedicalRecordsTable records={records} />
      </div>
    </section>
  );
}
