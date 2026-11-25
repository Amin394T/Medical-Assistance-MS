import { HandCoins } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { listInvoiceSettlements } from "@/db/actions/invoiceSettlements";
import { listServiceProviders } from "@/db/actions/serviceProviders";

export const dynamic = "force-dynamic";

export default async function InvoiceSettlementsPage() {
  const [settlements, providers] = await Promise.all([listInvoiceSettlements(), listServiceProviders()]);
  const rows = settlements.map((item) => ({
    id: item.id,
    reference: item.reference,
    href: `/billing/settlements/${item.id}`,
    serviceProvider: item.serviceProvider,
    receptionDate: item.receptionDate,
    totalAmount: item.totalAmount,
    paymentMode: item.paymentMode,
    paymentReference: item.paymentReference,
    bank: item.bank,
    settled: item.settled,
    settlementDate: item.settlementDate,
  }));
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-375">
    <PageHeader section="Billing Management" title="Service Settlement" icon={<HandCoins className="h-6 w-6" />} />
    <ReferencialDataGrid title="Invoice Settlements" rows={rows} readOnly detailsHrefPrefix="/billing/settlements" createHref="/billing/settlements/new" createLabel="New Settlement" columns={[
      { key: "reference", label: "Reference", readOnly: true, linkHrefKey: "href" },
      { key: "serviceProvider", label: "Service Provider", readOnly: true },
      { key: "receptionDate", label: "Reception Date", format: "date", readOnly: true },
      { key: "totalAmount", label: "Total Amount", readOnly: true },
      { key: "paymentMode", label: "Payment Mode", readOnly: true, options: [{ value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" }] },
      { key: "paymentReference", label: "Payment Reference", readOnly: true },
      { key: "bank", label: "Bank", readOnly: true },
      { key: "settled", label: "Settled", editor: "checkbox", readOnly: true },
      { key: "settlementDate", label: "Settlement Date", format: "date", readOnly: true },
    ]} filters={[
      { key: "reference", label: "Reference" },
      { key: "serviceProvider", label: "Service Provider", type: "select", options: providers.map(({ label }) => ({ value: label, label })) },
      { key: "receptionDate", label: "Reception Date", type: "dateRange" },
      { key: "settled", label: "Settled", type: "select", options: [{ value: true, label: "Yes" }, { value: false, label: "No" }] },
    ]} />
  </div></section>;
}
