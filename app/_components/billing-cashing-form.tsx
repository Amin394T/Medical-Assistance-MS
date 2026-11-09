"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBillingCashing, updateBillingCashing } from "@/db/actions/billingCashings";

type InsuranceProviderOption = { id: number; label: string };
type CashingInvoice = {
  id: number;
  medicalRecordId: number;
  medicalRecordReference: string | number;
  reference: string | number;
  issueDate: Date;
  totalAmount: number;
};
type InvoiceOption = CashingInvoice & {
  insuranceProviderId: number;
};
type CashingValues = {
  id: number;
  insuranceProviderId: number;
  bank: string | null;
  paymentMode: "CHQ" | "VRM" | "CSH" | null;
  paymentReference: string | null;
  cashed: boolean | null;
  cashingDate: Date | null;
  invoices: CashingInvoice[];
};

const paymentModes = [
  { value: "", label: "Select a payment mode" },
  { value: "CHQ", label: "Check" },
  { value: "VRM", label: "Transfer" },
  { value: "CSH", label: "Cash" },
] as const;

export function BillingCashingForm({
  providers,
  availableInvoices,
  cashing,
}: {
  providers: InsuranceProviderOption[];
  availableInvoices: InvoiceOption[];
  cashing?: CashingValues;
}) {
  const router = useRouter();
  const [insuranceProviderId, setInsuranceProviderId] = useState(String(cashing?.insuranceProviderId ?? ""));
  const [invoiceIds, setInvoiceIds] = useState<number[]>(cashing?.invoices.map(({ id }) => id) ?? []);
  const [bank, setBank] = useState(cashing?.bank ?? "");
  const [paymentMode, setPaymentMode] = useState(cashing?.paymentMode ?? "");
  const [paymentReference, setPaymentReference] = useState(cashing?.paymentReference ?? "");
  const [cashed, setCashed] = useState(Boolean(cashing?.cashed));
  const [cashingDate, setCashingDate] = useState(cashing?.cashingDate ? toDateInputValue(cashing.cashingDate) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isEditing = cashing !== undefined;
  const invoices: CashingInvoice[] = isEditing ? cashing.invoices : availableInvoices.filter(
    (invoice) => String(invoice.insuranceProviderId) === insuranceProviderId,
  );
  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => invoiceIds.includes(invoice.id)),
    [invoiceIds, invoices],
  );
  const totalAmount = selectedInvoices.reduce((total, invoice) => total + invoice.totalAmount, 0);

  const toggleInvoice = (invoiceId: number, checked: boolean) => {
    setInvoiceIds((current) => checked
      ? [...current, invoiceId]
      : current.filter((id) => id !== invoiceId));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const input = {
        insuranceProviderId: Number(insuranceProviderId),
        invoiceIds,
        bank: bank.trim() || null,
        paymentMode: paymentMode ? paymentMode as "CHQ" | "VRM" | "CSH" : null,
        paymentReference: paymentReference.trim() || null,
        cashed,
        cashingDate: cashingDate ? new Date(`${cashingDate}T00:00:00`) : null,
      };
      if (cashing) {
        const updated = await updateBillingCashing(cashing.id, input);
        if (!updated) throw new Error("The billing cashing could not be updated.");
        router.push("/billing/cashings");
      } else {
        const created = await createBillingCashing(input);
        if (!created) throw new Error("The billing cashing could not be created.");
        router.push(`/billing/cashings/${created.id}`);
      }
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The billing cashing could not be saved.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error ? <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Insurance Provider</span>
          <select
            required
            value={insuranceProviderId}
            disabled={isEditing}
            onChange={(event) => {
              setInsuranceProviderId(event.target.value);
              setInvoiceIds([]);
            }}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
          >
            <option value="">Select an insurance provider</option>
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Bank</span>
          <input value={bank} onChange={(event) => setBank(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Payment Mode</span>
          <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as typeof paymentMode)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
            {paymentModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Payment Reference</span>
          <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Cashing Date</span>
          <input type="date" value={cashingDate} onChange={(event) => setCashingDate(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={cashed} disabled={Boolean(cashing?.cashed)} onChange={(event) => setCashed(event.target.checked)} className="h-4 w-4 accent-teal-700 disabled:opacity-50" />
          Cashed
        </label>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
            <p className="text-sm text-slate-500">{isEditing ? "Invoices linked to this cashing are read-only." : "Select non-cashed invoices for this insurance provider."}</p>
          </div>
          <p className="whitespace-nowrap text-sm font-semibold text-slate-700">Total: {totalAmount.toFixed(2)}</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {!isEditing ? <th className="w-12 px-4 py-3"><span className="sr-only">Select</span></th> : null}
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length ? invoices.map((invoice) => (
                <tr key={invoice.id}>
                  {!isEditing ? <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select invoice ${invoice.reference}`}
                      checked={invoiceIds.includes(invoice.id)}
                      onChange={(event) => toggleInvoice(invoice.id, event.target.checked)}
                      className="h-4 w-4 accent-teal-700"
                    />
                  </td> : null}
                  <td className="px-4 py-3 font-medium text-slate-800">{invoice.reference}</td>
                  <td className="px-4 py-3 text-slate-600">{invoice.medicalRecordReference}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{invoice.totalAmount.toFixed(2)}</td>
                </tr>
              )) : <tr><td colSpan={isEditing ? 4 : 5} className="px-4 py-10 text-center text-slate-500">
                {insuranceProviderId ? "No available invoices for this provider." : "Select an insurance provider to view invoices."}
              </td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <Link href="/billing/cashings" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
        <button type="submit" disabled={pending || !invoiceIds.length} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Saving..." : isEditing ? "Save Changes" : "Create Cashing"}
        </button>
      </div>
    </form>
  );
}

function toDateInputValue(value: Date) {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}
