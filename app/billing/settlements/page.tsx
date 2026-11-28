import { HandCoins } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { InvoiceSettlementsTable } from "@/app/_components/invoice-settlements-table";
import { listInvoiceSettlements } from "@/db/actions/invoiceSettlements";
import { listServiceProviders } from "@/db/actions/serviceProviders";

export const dynamic = "force-dynamic";

export default async function InvoiceSettlementsPage() {
  const [settlements, providers] = await Promise.all([listInvoiceSettlements(), listServiceProviders()]);
  return <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10"><div className="mx-auto max-w-375">
    <PageHeader section="Billing" title="Service Settlement" icon={<HandCoins className="h-6 w-6" />} />
    <InvoiceSettlementsTable rows={settlements} providers={providers.map(({ label }) => label)} />
  </div></section>;
}
