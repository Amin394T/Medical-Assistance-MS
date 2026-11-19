import { FileText } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { getGridListQuery } from "@/app/_lib/grid-list-query";
import { listBillingCashings } from "@/db/actions/billingCashings";

export const dynamic = "force-dynamic";

export default async function BillingCashingsPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await getGridListQuery(searchParams, "requestDate");
  const list = await listBillingCashings(query);

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Facturation" title="Encaissement des Factures" icon={<FileText className="h-6 w-6" />} />
        <ReferencialDataGrid
          key={JSON.stringify([list.search, list.sort, list.sortDesc])}
          title="Encaissements des Factures"
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
            { key: "insuranceProvider", label: "Compagnie d’Assurance", readOnly: true },
            { key: "requestDate", label: "Date de la Demande", format: "datetime", readOnly: true },
            { key: "totalAmount", label: "Montant Total", readOnly: true },
            { key: "invoiceCount", label: "Factures", readOnly: true },
            { key: "bank", label: "Banque", readOnly: true },
            { key: "paymentMode", label: "Mode de Paiement", readOnly: true, options: [
              { value: "CHQ", label: "Chèque" }, { value: "VRM", label: "Virement" }, { value: "CSH", label: "Espèces" },
            ] },
            { key: "paymentReference", label: "Référence de Paiement", readOnly: true },
            { key: "cashed", label: "Encaissée", editor: "checkbox", readOnly: true },
            { key: "cashingDate", label: "Date d’Encaissement", format: "date", readOnly: true },
          ]}
          readOnly
          detailsHrefPrefix="/billing/cashings"
          createHref="/billing/cashings/new"
          createLabel="Nouvel Encaissement"
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
