import { FilePlus2 } from "lucide-react";

import { InvoiceCreationForm } from "@/app/_components/invoice-creation-form";
import { PageHeader } from "@/app/_components/page-header";
import { listInvoiceCreationRecords } from "@/db/actions/billingInvoices";

export const dynamic = "force-dynamic";

export default async function InvoiceCreationPage() {
  const records = await listInvoiceCreationRecords();
  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Billing Management" title="Invoice Creation" icon={<FilePlus2 className="h-6 w-6" />} />
        <InvoiceCreationForm records={records} />
      </div>
    </section>
  );
}
