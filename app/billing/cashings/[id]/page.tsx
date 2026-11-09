import { HandCoins } from "lucide-react";
import { notFound } from "next/navigation";

import { BillingCashingForm } from "@/app/_components/billing-cashing-form";
import { PageHeader } from "@/app/_components/page-header";
import { getBillingCashing } from "@/db/actions/billingCashings";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";

export const dynamic = "force-dynamic";

export default async function BillingCashingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idValue } = await params;
  const id = Number(idValue);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [cashing, providers] = await Promise.all([
    getBillingCashing(id),
    listInsuranceProviders(),
  ]);
  if (!cashing) notFound();

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader section="Billing" title={`Cashing #${cashing.id}`} icon={<HandCoins className="h-6 w-6" />} />
        <BillingCashingForm
          providers={providers.map(({ id: providerId, label }) => ({ id: providerId, label }))}
          availableInvoices={[]}
          cashing={cashing}
        />
      </div>
    </section>
  );
}
