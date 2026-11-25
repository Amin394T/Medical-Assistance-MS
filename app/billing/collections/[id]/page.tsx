import { notFound } from "next/navigation";
import { HandCoins } from "lucide-react";

import { InvoiceCollectionForm } from "@/app/_components/invoice-collection-form";
import { PageHeader } from "@/app/_components/page-header";
import { getInvoiceCollection, listAvailableCollectionInvoices } from "@/db/actions/invoiceCollections";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";

export const dynamic = "force-dynamic";

export default async function InvoiceCollectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [collection, providers, availableInvoices] = await Promise.all([
    getInvoiceCollection(id),
    listInsuranceProviders(),
    listAvailableCollectionInvoices(id),
  ]);
  if (!collection) notFound();
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-6xl">
    <PageHeader section="Billing Management" title={`Collection ${collection.reference}`} icon={<HandCoins className="h-6 w-6" />} />
    <InvoiceCollectionForm
      providers={providers.map(({ id: providerId, label }) => ({ id: providerId, label }))}
      availableInvoices={availableInvoices}
      collection={collection}
    />
  </div></section>;
}
