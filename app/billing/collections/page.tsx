import { HandCoins } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { listInvoiceCollections } from "@/db/actions/invoiceCollections";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";

export const dynamic = "force-dynamic";

export default async function InvoiceCollectionsPage() {
  const [collections, providers] = await Promise.all([listInvoiceCollections(), listInsuranceProviders()]);
  const rows = collections.map((item) => ({
    id: item.id,
    reference: item.reference,
    href: `/billing/collections/${item.id}`,
    insuranceProvider: item.insuranceProvider,
    requestDate: item.requestDate,
    totalAmount: item.totalAmount,
    paymentMode: item.paymentMode,
    paymentReference: item.paymentReference,
    bank: item.bank,
    collected: item.collected,
    collectionDate: item.collectionDate,
  }));
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-375">
    <PageHeader section="Billing Management" title="Invoice Collection" icon={<HandCoins className="h-6 w-6" />} />
    <ReferencialDataGrid title="Invoice Collections" rows={rows} readOnly detailsHrefPrefix="/billing/collections" createHref="/billing/collections/new" createLabel="New Collection" columns={[
      { key: "reference", label: "Reference", readOnly: true, linkHrefKey: "href" },
      { key: "insuranceProvider", label: "Insurance Provider", readOnly: true },
      { key: "requestDate", label: "Request Date", format: "datetime", readOnly: true },
      { key: "totalAmount", label: "Total Amount", readOnly: true },
      { key: "paymentMode", label: "Payment Mode", readOnly: true, options: [{ value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" }] },
      { key: "paymentReference", label: "Payment Reference", readOnly: true },
      { key: "bank", label: "Bank", readOnly: true },
      { key: "collected", label: "Collected", editor: "checkbox", readOnly: true },
      { key: "collectionDate", label: "Collection Date", format: "date", readOnly: true },
    ]} filters={[
      { key: "reference", label: "Reference" },
      { key: "insuranceProvider", label: "Insurance Provider", type: "select", options: providers.map(({ label }) => ({ value: label, label })) },
      { key: "requestDate", label: "Request Date", type: "dateRange" },
      { key: "collected", label: "Collected", type: "select", options: [{ value: true, label: "Yes" }, { value: false, label: "No" }] },
    ]} />
  </div></section>;
}
