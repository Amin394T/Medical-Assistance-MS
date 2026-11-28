import { ReceiptText } from "lucide-react";

import { PageHeader } from "@/app/_components/page-header";
import { BillingInvoicesTable } from "@/app/_components/billing-invoices-table";
import { listBillingInvoices } from "@/db/actions/billingInvoices";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await listBillingInvoices();
  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Billing" title="Record Billing" icon={<ReceiptText className="h-6 w-6" />} />
        <BillingInvoicesTable rows={invoices} />
      </div>
    </section>
  );
}
