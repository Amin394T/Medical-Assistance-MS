import { FileText } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { getBillingListQuery } from "@/app/_lib/billing-list-query";
import { listBillingCashings } from "@/db/actions/billingCashings";

export const dynamic = "force-dynamic";

export default async function BillingCashingsPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await getBillingListQuery(searchParams, "requestDate");
  const list = await listBillingCashings(query);

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Billing" title="Invoice Cashing" icon={<FileText className="h-6 w-6" />} />
        <ReferencialDataGrid
          key={JSON.stringify([list.search, list.sort, list.sortDesc])}
          title="Invoice Cashings"
          rows={list.rows.map((row) => ({
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
            { key: "requestDate", label: "Request Date", format: "datetime", readOnly: true },
            { key: "totalAmount", label: "Total Amount", readOnly: true },
            { key: "invoiceCount", label: "Invoices", readOnly: true },
            { key: "bank", label: "Bank", readOnly: true },
            { key: "paymentMode", label: "Payment Mode", readOnly: true, options: [
              { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" },
            ] },
            { key: "paymentReference", label: "Payment Reference", readOnly: true },
            { key: "cashed", label: "Cashed", editor: "checkbox", readOnly: true },
            { key: "cashingDate", label: "Cashing Date", format: "date", readOnly: true },
          ]}
          readOnly
          detailsHrefPrefix="/billing/cashings"
          createHref="/billing/cashings/new"
          createLabel="New Cashing"
          initialSearch={list.search}
          serverPagination={{
            page: list.page,
            pageSize: list.pageSize,
            totalCount: list.totalCount,
            sort: list.sort,
            sortDesc: list.sortDesc,
            defaultSort: "requestDate",
            defaultSortDesc: true,
          }}
        />
      </div>
    </section>
  );
}
