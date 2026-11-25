import { FileText } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";
import { listBillingInvoices } from "@/db/actions/billingInvoices";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await listBillingInvoices();
  const rows = invoices.map((invoice) => ({
    id: invoice.id,
    reference: invoice.reference,
    record: formatMedicalRecordReference(invoice.accidentType, invoice.medicalRecordReference),
    issueDate: invoice.issueDate,
    totalAmount: invoice.totalAmount,
    collection: invoice.collectionReference === null ? "-" : String(invoice.collectionReference),
    collected: invoice.collected,
  }));
  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Billing Management" title="Record Billing" icon={<FileText className="h-6 w-6" />} />
        <ReferencialDataGrid
          title="Invoices"
          rows={rows}
          readOnly
          createHref="/billing/invoices/new"
          createLabel="New Invoice"
          columns={[
            { key: "reference", label: "Reference", readOnly: true },
            { key: "record", label: "Record", readOnly: true },
            { key: "issueDate", label: "Issue Date", format: "date", readOnly: true },
            { key: "totalAmount", label: "Total Amount", readOnly: true },
            { key: "collection", label: "Collection", readOnly: true },
            { key: "collected", label: "Cashed", editor: "checkbox", readOnly: true },
          ]}
          filters={[
            { key: "reference", label: "Reference" },
            { key: "record", label: "Record" },
            { key: "collected", label: "Cashed", type: "select", options: [{ value: true, label: "Yes" }, { value: false, label: "No" }] },
          ]}
        />
      </div>
    </section>
  );
}
