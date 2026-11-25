"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceSettlement, updateInvoiceSettlement } from "@/db/actions/invoiceSettlements";
import { formatDate } from "@/app/_lib/date-format";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";

type ProviderOption = { id: number; label: string };
type ServiceOption = {
  id: number;
  medicalRecordId: number;
  recordReference: number;
  accidentType: "AT" | "MD" | "VP" | "SS" | "MP";
  serviceType: string;
  serviceProviderId: number;
  serviceProvider: string;
  date: Date;
  paymentAmount: number;
  billingAmount: number;
  taxRate: number;
  settlementId?: number | null;
};
type SettlementValue = {
  id: number;
  reference: number;
  serviceProviderId: number;
  receptionDate: Date | null;
  totalAmount: number;
  paymentMode: "CHQ" | "VRM" | "CSH" | null;
  paymentReference: string | null;
  bank: string | null;
  settled: boolean;
  settlementDate: Date | null;
  services: ServiceOption[];
};

const modes = [{ value: "", label: "Not specified" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" }] as const;

export function InvoiceSettlementForm({ providers, services, settlement }: {
  providers: ProviderOption[];
  services: ServiceOption[];
  settlement?: SettlementValue;
}) {
  const router = useRouter();
  const [providerId, setProviderId] = useState(String(settlement?.serviceProviderId ?? ""));
  const [selectedIds, setSelectedIds] = useState<number[]>(settlement?.services.map(({ id }) => id) ?? []);
  const [paymentMode, setPaymentMode] = useState(settlement?.paymentMode ?? "");
  const [paymentReference, setPaymentReference] = useState(settlement?.paymentReference ?? "");
  const [bank, setBank] = useState(settlement?.bank ?? "");
  const [settled, setSettled] = useState(settlement?.settled ?? false);
  const [settlementDate, setSettlementDate] = useState(settlement?.settlementDate ? dateInput(settlement.settlementDate) : "");
  const [recordFilter, setRecordFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const visibleServices = useMemo(() => services.filter((service) => {
    const ref = formatMedicalRecordReference(service.accidentType, service.recordReference).toLowerCase();
    return (!providerId || String(service.serviceProviderId) === providerId) &&
      ref.includes(recordFilter.trim().toLowerCase()) &&
      service.serviceProvider.toLowerCase().includes(providerFilter.trim().toLowerCase());
  }), [providerFilter, providerId, recordFilter, services]);
  const total = services.filter((service) => selectedIds.includes(service.id)).reduce((sum, service) => sum + service.paymentAmount, 0);

  const toggle = (id: number, checked: boolean) => setSelectedIds((ids) => checked ? [...ids, id] : ids.filter((value) => value !== id));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      const input = {
        serviceProviderId: Number(providerId),
        serviceIds: selectedIds,
        receptionDate: settlement?.receptionDate ?? new Date(),
        paymentMode: paymentMode ? paymentMode as "CHQ" | "VRM" | "CSH" : null,
        paymentReference: paymentReference || null,
        bank: bank || null,
        settled,
        settlementDate: settlementDate ? new Date(`${settlementDate}T00:00:00`) : null,
      };
      if (settlement) {
        const updated = await updateInvoiceSettlement(settlement.id, input);
        if (!updated) throw new Error("Invoice settlement not found.");
      } else {
        await createInvoiceSettlement(input);
      }
      setNotice(settlement ? "Settlement updated." : "Settlement created.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The settlement could not be saved.");
    } finally {
      setPending(false);
    }
  };

  return <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    {error ? <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {settlement ? <ReadOnlyField label="Reference" value={settlement.reference} /> : null}
      <label className="block"><FieldLabel>Service Provider</FieldLabel><select required value={providerId} disabled={Boolean(settlement?.settled)} onChange={(event) => { setProviderId(event.target.value); setSelectedIds([]); }} className={inputClass}><option value="">Select a provider</option>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}</select></label>
      <label className="block"><FieldLabel>Reception Date</FieldLabel><input type="date" defaultValue={settlement?.receptionDate ? dateInput(settlement.receptionDate) : dateInput(new Date())} readOnly={Boolean(settlement)} className={inputClass} /></label>
      <ReadOnlyField label="Total Amount" value={total.toFixed(2)} />
      <label className="block"><FieldLabel>Payment Mode</FieldLabel><select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as typeof paymentMode)} className={inputClass}>{modes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
      <label className="block"><FieldLabel>Payment Reference</FieldLabel><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className={inputClass} /></label>
      <label className="block"><FieldLabel>Bank</FieldLabel><input value={bank} onChange={(event) => setBank(event.target.value)} className={inputClass} /></label>
      <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={settled} disabled={Boolean(settlement?.settled)} onChange={(event) => setSettled(event.target.checked)} className="h-4 w-4 accent-teal-700" />Settled</label>
      <label className="block"><FieldLabel>Settlement Date</FieldLabel><input type="date" value={settlementDate} disabled={!settled || Boolean(settlement?.settled)} onChange={(event) => setSettlementDate(event.target.value)} className={inputClass} /></label>
    </div>
    <section>
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <label className="block"><FieldLabel>Medical Record Reference</FieldLabel><input value={recordFilter} onChange={(event) => setRecordFilter(event.target.value)} className={inputClass} /></label>
        <label className="block"><FieldLabel>Provider</FieldLabel><input value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)} className={inputClass} /></label>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-200 text-left text-sm">
        <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Select</th><th className="px-3 py-3">Service Type</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Payment Amount</th><th className="px-3 py-3">Billing Amount</th><th className="px-3 py-3">Tax Rate</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{visibleServices.map((service) => <tr key={service.id}>
          <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(service.id)} disabled={Boolean(settlement?.settled)} onChange={(event) => toggle(service.id, event.target.checked)} aria-label={`Select service ${service.serviceType}`} className="h-4 w-4 accent-teal-700" /></td>
          <td className="px-3 py-3">{service.serviceType}</td><td className="px-3 py-3">{service.serviceProvider}</td><td className="px-3 py-3">{formatDate(service.date)}</td><td className="px-3 py-3">{service.paymentAmount.toFixed(2)}</td><td className="px-3 py-3">{service.billingAmount.toFixed(2)}</td><td className="px-3 py-3">{service.taxRate}</td>
        </tr>)}
        {!visibleServices.length ? <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">{providerId ? "No services are available for this provider." : "Select a service provider to view services."}</td></tr> : null}</tbody>
      </table></div>
    </section>
    <div className="flex justify-end border-t border-slate-100 pt-4"><button type="submit" disabled={pending || !selectedIds.length} className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Saving..." : settlement ? "Save Changes" : "Create Settlement"}</button></div>
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
