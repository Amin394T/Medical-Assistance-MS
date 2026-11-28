import { Wallet } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { InvoiceCollectionsTable } from "@/app/_components/invoice-collections-table";
import { listInvoiceCollections } from "@/db/actions/invoiceCollections";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";

export const dynamic = "force-dynamic";

export default async function InvoiceCollectionsPage() {
  const [collections, providers] = await Promise.all([listInvoiceCollections(), listInsuranceProviders()]);
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-375">
    <PageHeader section="Billing" title="Invoice Collection" icon={<Wallet className="h-6 w-6" />} />
    <InvoiceCollectionsTable rows={collections} providers={providers.map(({ label }) => label)} />
  </div></section>;
}
