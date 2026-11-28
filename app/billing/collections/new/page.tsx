import { Wallet } from "lucide-react";

import { InvoiceCollectionForm } from "@/app/_components/invoice-collection-form";
import { PageHeader } from "@/app/_components/page-header";
import { listAvailableCollectionInvoices } from "@/db/actions/invoiceCollections";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";

export const dynamic = "force-dynamic";

export default async function NewInvoiceCollectionPage() {
  const [providers, invoices] = await Promise.all([listInsuranceProviders(), listAvailableCollectionInvoices()]);
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-6xl">
    <PageHeader section="Billing" title="Collection Details" icon={<Wallet className="h-6 w-6" />} />
    <InvoiceCollectionForm providers={providers.map(({ id, label }) => ({ id, label }))} availableInvoices={invoices} />
  </div></section>;
}
