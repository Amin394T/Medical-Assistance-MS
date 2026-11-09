import { HandCoins } from "lucide-react";

import { BillingCashingForm } from "@/app/_components/billing-cashing-form";
import { PageHeader } from "@/app/_components/page-header";
import { listAvailableBillingInvoices } from "@/db/actions/billingInvoices";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";

export const dynamic = "force-dynamic";

export default async function NewBillingCashingPage() {
  const [providers, invoices] = await Promise.all([
    listInsuranceProviders(),
    listAvailableBillingInvoices(),
  ]);

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader section="Billing" title="New Invoice Cashing" icon={<HandCoins className="h-6 w-6" />} />
        <BillingCashingForm
          providers={providers.map(({ id, label }) => ({ id, label }))}
          availableInvoices={invoices}
        />
      </div>
    </section>
  );
}
