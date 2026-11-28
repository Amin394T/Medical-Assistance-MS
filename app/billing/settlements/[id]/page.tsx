import { notFound } from "next/navigation";
import { HandCoins } from "lucide-react";

import { InvoiceSettlementForm } from "@/app/_components/invoice-settlement-form";
import { PageHeader } from "@/app/_components/page-header";
import { getInvoiceSettlement, listSettlementServices } from "@/db/actions/invoiceSettlements";
import { listServiceProviders } from "@/db/actions/serviceProviders";

export const dynamic = "force-dynamic";

export default async function InvoiceSettlementDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [settlement, providers, services] = await Promise.all([
    getInvoiceSettlement(id),
    listServiceProviders(),
    listSettlementServices(id),
  ]);
  if (!settlement) notFound();
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-375">
    <PageHeader section="Billing" title={`Settlement ${settlement.reference}`} icon={<HandCoins className="h-6 w-6" />} />
    <InvoiceSettlementForm providers={providers.map(({ id: providerId, label }) => ({ id: providerId, label }))} services={services} settlement={settlement} />
  </div></section>;
}
