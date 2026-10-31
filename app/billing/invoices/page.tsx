import { FileText } from "lucide-react";

import { createInvoiceFromGrid, deleteInvoice, listInvoices, updateInvoiceFromGrid } from "@/db/actions/invoices";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [rows, providers] = await Promise.all([listInvoices(), listInsuranceProviders()]);

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Billing" title="Invoice Management" icon={<FileText className="h-6 w-6" />} />
        <ReferencialDataGrid
          title="Invoices"
          rows={rows.map((row) => ({
            id: row.id,
            date: row.date,
            totalAmount: row.totalAmount,
            insuranceProviderId: row.insuranceProviderId,
            bank: row.bank ?? null,
            paymentMode: row.paymentMode ?? null,
            paymentReference: row.paymentReference ?? null,
            cashed: Boolean(row.cashed),
            cashingDate: row.cashingDate ?? null,
          }))}
          columns={[
            { key: "date", label: "Date", format: "date", readOnly: true },
            { key: "insuranceProviderId", label: "Insurance Provider", editor: "select", required: true, options: providers.map(({ id, label }) => ({ value: id, label })) },
            { key: "totalAmount", label: "Total Amount", editor: "number", required: true },
            { key: "bank", label: "Bank", nullable: true },
            { key: "paymentMode", label: "Payment Mode", editor: "select", nullable: true, options: [
              { value: null, label: "None" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" },
            ] },
            { key: "paymentReference", label: "Payment Reference", nullable: true },
            { key: "cashed", label: "Cashed", editor: "checkbox" },
            { key: "cashingDate", label: "Cashing Date", editor: "date", format: "date", nullable: true },
          ]}
          onCreate={createInvoiceFromGrid}
          onUpdate={updateInvoiceFromGrid}
          onDelete={deleteInvoice}
        />
      </div>
    </section>
  );
}
