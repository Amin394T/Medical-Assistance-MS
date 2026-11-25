import { HandCoins } from "lucide-react";

import { InvoiceSettlementForm } from "@/app/_components/invoice-settlement-form";
import { PageHeader } from "@/app/_components/page-header";
import { listSettlementServices } from "@/db/actions/invoiceSettlements";
import { listServiceProviders } from "@/db/actions/serviceProviders";

export const dynamic = "force-dynamic";

export default async function NewInvoiceSettlementPage() {
  const [providers, services] = await Promise.all([listServiceProviders(), listSettlementServices()]);
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-375">
    <PageHeader section="Billing Management" title="Settlement Details" icon={<HandCoins className="h-6 w-6" />} />
    <InvoiceSettlementForm providers={providers.map(({ id, label }) => ({ id, label }))} services={services} />
  </div></section>;
}
