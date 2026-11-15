import { ClipboardList } from "lucide-react";

import { loadMedicalRecordList } from "@/app/_lib/medical-record-list";
import { MedicalRecordsTable } from "@/app/_components/medical-records-table";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const list = await loadMedicalRecordList(searchParams);

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Assistance" title="Medical Records" icon={<ClipboardList />} />
        <MedicalRecordsTable key={JSON.stringify([list.page, list.filters, list.sort, list.sortDesc])} {...list} />
      </div>
    </section>
  );
}
