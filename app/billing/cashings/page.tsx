import { FileText } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { listBillingCashings } from "@/db/actions/billingCashings";

export const dynamic = "force-dynamic";

export default async function BillingCashingsPage() {
  const rows = await listBillingCashings();

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Billing" title="Invoice Cashing" icon={<FileText className="h-6 w-6" />} />
        <ReferencialDataGrid
          title="Invoice Cashings"
          rows={rows.map((row) => ({
            id: row.id,
            insuranceProvider: row.insuranceProvider,
            requestDate: row.requestDate,
            totalAmount: row.totalAmount,
            invoiceCount: row.invoiceCount,
            bank: row.bank,
            paymentMode: row.paymentMode,
            paymentReference: row.paymentReference,
            cashed: Boolean(row.cashed),
            cashingDate: row.cashingDate,
          }))}
          columns={[
            { key: "insuranceProvider", label: "Insurance Provider", readOnly: true },
            { key: "requestDate", label: "Request Date", format: "date", readOnly: true },
            { key: "totalAmount", label: "Total Amount", readOnly: true },
            { key: "invoiceCount", label: "Invoices", readOnly: true },
            { key: "bank", label: "Bank", readOnly: true },
            { key: "paymentMode", label: "Payment Mode", readOnly: true, options: [
              { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" },
            ] },
            { key: "paymentReference", label: "Payment Reference", readOnly: true },
            { key: "cashed", label: "Cashed", readOnly: true },
            { key: "cashingDate", label: "Cashing Date", format: "date", readOnly: true },
          ]}
          readOnly
          detailsHrefPrefix="/billing/cashings"
          createHref="/billing/cashings/new"
          createLabel="New Cashing"
        />
      </div>
    </section>
  );
}
