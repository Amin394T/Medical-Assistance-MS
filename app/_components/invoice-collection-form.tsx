"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceCollection, updateInvoiceCollection } from "@/db/actions/invoiceCollections";
import { formatDate, formatDateTime } from "@/app/_lib/date-format";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";

type ProviderOption = { id: number; label: string };
type InvoiceOption = {
  id: number;
  medicalRecordId: number;
  medicalRecordReference: number;
  medicalRecordType: "AT" | "MD" | "VP" | "SS" | "MP";
  reference: number;
  issueDate: Date;
  totalAmount: number;
  insuranceProviderId: number;
  insuranceProvider?: string;
};
type CollectionValue = {
  id: number;
  reference: number;
  insuranceProviderId: number;
  requestDate: Date;
  totalAmount: number;
  paymentMode: "CHQ" | "VRM" | "CSH" | null;
  paymentReference: string | null;
  bank: string | null;
  collected: boolean;
  collectionDate: Date | null;
  invoices: Omit<InvoiceOption, "insuranceProviderId">[];
};

const modes = [{ value: "", label: "Not specified" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" }] as const;

export function InvoiceCollectionForm({ providers, availableInvoices, collection }: {
  providers: ProviderOption[];
  availableInvoices: InvoiceOption[];
  collection?: CollectionValue;
}) {
  const router = useRouter();
  const [providerId, setProviderId] = useState(String(collection?.insuranceProviderId ?? ""));
  const [selectedIds, setSelectedIds] = useState<number[]>(collection?.invoices.map(({ id }) => id) ?? []);
  const [paymentMode, setPaymentMode] = useState(collection?.paymentMode ?? "");
  const [paymentReference, setPaymentReference] = useState(collection?.paymentReference ?? "");
  const [bank, setBank] = useState(collection?.bank ?? "");
  const [collected, setCollected] = useState(collection?.collected ?? false);
  const [collectionDate, setCollectionDate] = useState(collection?.collectionDate ? dateInput(collection.collectionDate) : "");
  const [recordFilter, setRecordFilter] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const invoices = useMemo(() => {
    const current = collection?.invoices.map((invoice) => ({ ...invoice, insuranceProviderId: collection.insuranceProviderId })) ?? [];
    const combined = [...current, ...availableInvoices.filter((invoice) => !current.some(({ id }) => id === invoice.id))];
    return combined.filter((invoice) => String(invoice.insuranceProviderId) === providerId &&
      formatMedicalRecordReference(invoice.medicalRecordType, invoice.medicalRecordReference).toLowerCase().includes(recordFilter.toLowerCase()));
  }, [availableInvoices, collection, providerId, recordFilter]);
  const total = invoices.filter(({ id }) => selectedIds.includes(id)).reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const toggleInvoice = (id: number, checked: boolean) => setSelectedIds((ids) => checked ? [...ids, id] : ids.filter((value) => value !== id));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      const input = {
        insuranceProviderId: Number(providerId),
        invoiceIds: selectedIds,
        paymentMode: paymentMode ? paymentMode as "CHQ" | "VRM" | "CSH" : null,
        paymentReference: paymentReference || null,
        bank: bank || null,
        collected,
        collectionDate: collectionDate ? new Date(`${collectionDate}T00:00:00`) : null,
      };
      if (collection) {
        const updated = await updateInvoiceCollection(collection.id, input);
        if (!updated) throw new Error("Invoice collection not found.");
      } else {
        await createInvoiceCollection(input);
      }
      setNotice(collection ? "Collection updated." : "Collection created.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The collection could not be saved.");
    } finally {
      setPending(false);
    }
  };

  return <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    {error ? <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {collection ? <ReadOnlyField label="Reference" value={collection.reference} /> : null}
      <label className="block"><FieldLabel>Insurance Provider</FieldLabel><select required value={providerId} disabled={Boolean(collection?.collected)} onChange={(event) => { setProviderId(event.target.value); setSelectedIds([]); }} className={inputClass}><option value="">Select a provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}</select></label>
      {collection ? <ReadOnlyField label="Request Date" value={formatDateTime(collection.requestDate)} /> : null}
      <ReadOnlyField label="Total Amount" value={total.toFixed(2)} />
      <label className="block"><FieldLabel>Payment Mode</FieldLabel><select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as typeof paymentMode)} className={inputClass}>{modes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
      <label className="block"><FieldLabel>Payment Reference</FieldLabel><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className={inputClass} /></label>
      <label className="block"><FieldLabel>Bank</FieldLabel><input value={bank} onChange={(event) => setBank(event.target.value)} className={inputClass} /></label>
      <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={collected} disabled={Boolean(collection?.collected)} onChange={(event) => setCollected(event.target.checked)} className="h-4 w-4 accent-teal-700" />Collected</label>
      <label className="block"><FieldLabel>Collection Date</FieldLabel><input type="date" value={collectionDate} disabled={!collected || Boolean(collection?.collected)} onChange={(event) => setCollectionDate(event.target.value)} className={inputClass} /></label>
    </div>

    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
        <label className="block w-full max-w-sm"><FieldLabel>Medical Record Reference</FieldLabel><input value={recordFilter} onChange={(event) => setRecordFilter(event.target.value)} className={inputClass} /></label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
            <th className="px-3 py-3">Select</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3">Record</th><th className="px-3 py-3">Issue Date</th><th className="px-3 py-3 text-right">Total Amount</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">{invoices.map((invoice) => <tr key={invoice.id}>
            <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(invoice.id)} disabled={Boolean(collection?.collected)} onChange={(event) => toggleInvoice(invoice.id, event.target.checked)} aria-label={`Select invoice ${invoice.reference}`} className="h-4 w-4 accent-teal-700 disabled:opacity-50" /></td>
            <td className="px-3 py-3">{invoice.reference}</td><td className="px-3 py-3">{formatMedicalRecordReference(invoice.medicalRecordType, invoice.medicalRecordReference)}</td><td className="px-3 py-3">{formatDate(invoice.issueDate)}</td><td className="px-3 py-3 text-right">{invoice.totalAmount.toFixed(2)}</td>
          </tr>)}
          {!invoices.length ? <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">{providerId ? "No available invoices for this provider." : "Select an insurance provider to see invoices."}</td></tr> : null}</tbody>
        </table>
      </div>
    </section>
    <div className="flex justify-end border-t border-slate-100 pt-4"><button type="submit" disabled={pending || !selectedIds.length} className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Saving..." : collection ? "Save Changes" : "Create Collection"}</button></div>
  </form>;
}

function ReadOnlyField({ label, value }: { label: string; value: string | number }) {
  return <div><FieldLabel>{label}</FieldLabel><div className={inputClass}>{value}</div></div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-semibold text-slate-700">{children}</span>;
}

function dateInput(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50";
