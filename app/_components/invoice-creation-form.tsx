"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBillingInvoice, listUninvoicedServices } from "@/db/actions/billingInvoices";
import { formatDate } from "@/app/_lib/date-format";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";

type RecordOption = { id: number; reference: number; type: "AT" | "MD" | "VP" | "SS" | "MP"; victimFirstName: string | null; victimLastName: string | null };
type ServiceRow = Awaited<ReturnType<typeof listUninvoicedServices>>[number];
type ServiceDraft = ServiceRow & { selected: boolean };

export function InvoiceCreationForm({ records }: { records: RecordOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RecordOption | null>(null);
  const [services, setServices] = useState<ServiceDraft[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const matches = records.filter((record) => `${formatMedicalRecordReference(record.type, record.reference)} ${record.victimFirstName ?? ""} ${record.victimLastName ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 10);
  const isOptionsOpen = Boolean(query.trim() && !selectedRecord);

  const selectRecord = async (record: RecordOption) => {
    setSelectedRecord(record);
    setQuery(formatMedicalRecordReference(record.type, record.reference));
    setError("");
    try {
      const available = await listUninvoicedServices(record.id);
      setServices(available.map((service) => ({ ...service, selected: false })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load services for this record.");
      setServices([]);
    }
  };

  const updateService = (id: number, patch: Partial<ServiceDraft>) => {
    setServices((current) => current.map((service) => service.id === id ? { ...service, ...patch } : service));
  };

  const submit = async () => {
    if (!selectedRecord) return;
    const selected = services.filter((service) => service.selected);
    setPending(true);
    setError("");
    try {
      await createBillingInvoice(selectedRecord.id, selected.map(({ id, paymentAmount, billingAmount, taxRate }) => ({ id, paymentAmount, billingAmount, taxRate })));
      router.push("/billing/invoices");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the invoice.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error ? <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <label className="block max-w-xl">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Medical Record</span>
        <input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedRecord(null); setServices([]); }} placeholder="Search record reference or victim" role="combobox" aria-expanded={isOptionsOpen} aria-controls={isOptionsOpen ? "invoice-record-options" : undefined} aria-autocomplete="list" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        {isOptionsOpen ? <div id="invoice-record-options" role="listbox" className="mt-1 max-h-56 overflow-y-auto border border-slate-200 bg-white shadow-lg">
          {matches.length ? matches.map((record) => <button key={record.id} type="button" role="option" aria-selected={selectedRecord?.id === record.id} onClick={() => void selectRecord(record)} className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-teal-50">
            <span className="font-semibold">{formatMedicalRecordReference(record.type, record.reference)}</span>
            <span className="ml-2 text-slate-500">{[record.victimFirstName, record.victimLastName].filter(Boolean).join(" ")}</span>
          </button>) : <p className="px-3 py-3 text-sm text-slate-500">No matching records.</p>}
        </div> : null}
      </label>

      <div className="overflow-x-auto">
        <table className="w-full min-w-220 text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
            <th className="px-3 py-3">Select</th><th className="px-3 py-3">Service Type</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Payment Amount</th><th className="px-3 py-3">Billing Amount</th><th className="px-3 py-3">Tax Rate</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">{services.map((service) => <tr key={service.id}>
            <td className="px-3 py-3"><input type="checkbox" checked={service.selected} onChange={(event) => updateService(service.id, { selected: event.target.checked })} aria-label={`Select ${service.serviceType}`} className="h-4 w-4 accent-teal-700" /></td>
            <td className="px-3 py-3">{service.serviceType}</td><td className="px-3 py-3">{service.provider}</td><td className="px-3 py-3">{formatDate(service.date)}</td>
            {(["paymentAmount", "billingAmount", "taxRate"] as const).map((field) => <td key={field} className="px-3 py-3"><input type="number" min="0" step="0.01" value={service[field]} onChange={(event) => updateService(service.id, { [field]: Number(event.target.value) })} className="h-9 w-28 rounded-md border border-slate-200 px-2 text-right" aria-label={`${field} for ${service.serviceType}`} /></td>)}
          </tr>)}
          {!services.length ? <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">{selectedRecord ? "No uninvoiced services for this record." : "Select a medical record to view uninvoiced services."}</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button type="button" onClick={() => void submit()} disabled={pending || !selectedRecord || !services.some((service) => service.selected)} className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Creating..." : "Confirm Invoice"}</button>
      </div>
    </div>
  );
}
