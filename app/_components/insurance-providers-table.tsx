"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw, Save, SquarePen, SquarePlus, Trash2, X } from "lucide-react";
import { createColumnHelper, createSortedRowModel, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

import {
  createInsuranceProvider,
  deleteInsuranceProvider,
  listInsuranceProviderCommissions,
  updateInsuranceProvider,
  updateInsuranceProviderCommissions,
} from "@/db/actions/insuranceProviders";
import type { listInsuranceProviders } from "@/db/actions/insuranceProviders";

type ProviderRow = Awaited<ReturnType<typeof listInsuranceProviders>>[number];
type ProviderDraft = { label: string; phone: string; email: string };
type CommissionType = "AT" | "MD" | "VP" | "SS" | "MP";
type CommissionDraft = { recordType: CommissionType; commission: string };

const recordTypes: { code: CommissionType; label: string }[] = [
  { code: "AT", label: "Workplace Accident" },
  { code: "MD", label: "Illness & Pain" },
  { code: "VP", label: "Policy Verification" },
  { code: "SS", label: "Special Service" },
  { code: "MP", label: "Occupational Disease" },
];

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    text: (rowA, rowB, columnId) => String(rowA.getValue(columnId) ?? "").localeCompare(String(rowB.getValue(columnId) ?? ""), undefined, { numeric: true, sensitivity: "base" }),
  },
});

const columnHelper = createColumnHelper<typeof features, ProviderRow>();
const columns = columnHelper.columns([
  columnHelper.accessor("label", { header: "Label", sortFn: "text" }),
  columnHelper.accessor("phone", { header: "Phone", sortFn: "text" }),
  columnHelper.accessor("email", { header: "Email", sortFn: "text" }),
  columnHelper.accessor("recordFees", { header: "Record Fees" }),
]);

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
const inputClass = "h-9 w-full min-w-32 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export function InsuranceProvidersTable({ rows }: { rows: ProviderRow[] }) {
  const router = useRouter();
  const [labelFilter, setLabelFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "label", desc: false }]);
  const [drafts, setDrafts] = useState<Record<string, ProviderDraft>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [newDraft, setNewDraft] = useState<ProviderDraft | null>(null);
  const [newError, setNewError] = useState("");
  const [newSaving, setNewSaving] = useState(false);
  const [feesDialog, setFeesDialog] = useState<{ providerId: number; label: string; items: CommissionDraft[]; loading: boolean; saving: boolean; error: string } | null>(null);

  const filteredRows = useMemo(() => rows.filter((row) => row.label.toLowerCase().includes(labelFilter.trim().toLowerCase())), [rows, labelFilter]);
  const table = useTable({ features, columns, data: filteredRows, state: { sorting } });

  const resetTable = () => {
    setLabelFilter("");
    setSorting([{ id: "label", desc: false }]);
  };
  const toggleSort = (id: string) => {
    const current = sorting.find((entry) => entry.id === id);
    setSorting([{ id, desc: current ? !current.desc : false }]);
  };
  const startCreate = () => {
    setNewDraft({ label: "", phone: "", email: "" });
    setNewError("");
  };
  const saveNew = async () => {
    if (!newDraft) return;
    setNewSaving(true);
    setNewError("");
    try {
      await createInsuranceProvider(toProviderValues(newDraft));
      setNewDraft(null);
      router.refresh();
    } catch (error) {
      setNewError(errorMessage(error));
    } finally {
      setNewSaving(false);
    }
  };
  const saveRow = async (row: ProviderRow) => {
    const key = String(row.id);
    const draft = drafts[key];
    if (!draft) return;
    setSaving((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      if (deleting[key]) {
        await deleteInsuranceProvider(row.id);
      } else {
        const values = { ...row, ...toProviderValues(draft) };
        await updateInsuranceProvider(row.id, values);
      }
      clearRowState(key);
      router.refresh();
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: errorMessage(error) }));
    } finally {
      setSaving((current) => ({ ...current, [key]: false }));
    }
  };
  const clearRowState = (key: string) => {
    setDrafts((current) => omit(current, key));
    setDeleting((current) => omit(current, key));
    setErrors((current) => omit(current, key));
  };
  const openFees = async (row: ProviderRow) => {
    setFeesDialog({ providerId: row.id, label: row.label, items: [], loading: true, saving: false, error: "" });
    try {
      const encodedItems = await listInsuranceProviderCommissions(row.id);
      const items = encodedItems.map((item) => {
        const [recordType, commission] = item.split("|");
        return { recordType: recordType as CommissionType, commission: commission ?? "0" };
      });
      setFeesDialog((current) => current?.providerId === row.id ? { ...current, items, loading: false } : current);
    } catch (error) {
      setFeesDialog((current) => current?.providerId === row.id
        ? { ...current, loading: false, error: errorMessage(error) }
        : current);
    }
  };
  const saveFees = async () => {
    if (!feesDialog) return;
    const dialog = feesDialog;
    setFeesDialog({ ...dialog, saving: true, error: "" });
    try {
      await updateInsuranceProviderCommissions(dialog.providerId, dialog.items.map(({ recordType, commission }) => `${recordType}|${commission}`));
      setFeesDialog(null);
      router.refresh();
    } catch (error) {
      setFeesDialog((current) => current ? { ...current, saving: false, error: errorMessage(error) } : current);
    }
  };

  return <>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Label</span><input value={labelFilter} onChange={(event) => setLabelFilter(event.target.value)} className={filterClass} placeholder="Any" /></label>
        <div className="hidden lg:block" />
        <div className="flex items-end justify-end gap-2"><button type="button" onClick={resetTable} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Reset Table</button><button type="button" onClick={startCreate} disabled={newDraft !== null} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"><SquarePlus className="h-3.5 w-3.5" />Create Provider</button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((group) => <tr key={group.id}><th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>{group.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" aria-sort={sorted === false ? "none" : sorted === "asc" ? "ascending" : "descending"} className="whitespace-nowrap px-5 py-3 font-semibold"><button type="button" onClick={() => toggleSort(header.column.id)} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"><table.FlexRender header={header} />{sortIcon(sorted)}</button></th>; })}</tr>)}</thead>
          <tbody className="divide-y divide-slate-100">
            {newDraft ? <tr className="bg-teal-50/50"><td className="whitespace-nowrap px-5 py-3 align-top"><div className="flex gap-2"><button type="button" aria-label="Save new provider" title="Save" onClick={() => void saveNew()} disabled={newSaving} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button><button type="button" aria-label="Cancel provider creation" title="Cancel" onClick={() => { setNewDraft(null); setNewError(""); }} disabled={newSaving} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>{newError ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{newError}</p> : null}</td><td className="px-3 py-3"><input aria-label="Label" value={newDraft.label} onChange={(event) => setNewDraft({ ...newDraft, label: event.target.value })} className={inputClass} /></td><td className="px-3 py-3"><input aria-label="Phone" value={newDraft.phone} onChange={(event) => setNewDraft({ ...newDraft, phone: event.target.value })} className={inputClass} /></td><td className="px-3 py-3"><input type="email" aria-label="Email" value={newDraft.email} onChange={(event) => setNewDraft({ ...newDraft, email: event.target.value })} className={inputClass} /></td><td className="px-3 py-3 text-slate-500">Configure after creating</td></tr> : null}
            {!table.getRowModel().rows.length && !newDraft ? <tr><td colSpan={columns.length + 1} className="px-5 py-16 text-center text-sm text-slate-500">No insurance providers match this filter.</td></tr> : table.getRowModel().rows.map((row) => {
              const provider = row.original;
              const key = String(provider.id);
              const draft = drafts[key];
              const markedForDeletion = deleting[key] === true;
              const values = draft ?? { label: provider.label, phone: provider.phone ?? "", email: provider.email ?? "" };
              const updateDraft = (patch: Partial<ProviderDraft>) => setDrafts((current) => ({ ...current, [key]: { ...values, ...patch } }));
              return <tr key={row.id} className={`transition-colors hover:bg-teal-50/40 ${markedForDeletion ? "bg-rose-50 text-rose-800" : ""}`}>
                <td className="whitespace-nowrap px-5 py-3 align-middle"><div className="flex gap-2">{draft
                  ? <><button type="button" aria-label="Save provider changes" title="Save" onClick={() => void saveRow(provider)} disabled={saving[key]} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button><button type="button" aria-label="Mark provider for deletion" title="Delete" onClick={() => setDeleting((current) => ({ ...current, [key]: !markedForDeletion }))} disabled={saving[key] || markedForDeletion} className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button><button type="button" aria-label="Cancel provider editing" title="Cancel" onClick={() => clearRowState(key)} disabled={saving[key]} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button></>
                  : <button type="button" aria-label="Edit provider" title="Edit" onClick={() => { setDrafts((current) => ({ ...current, [key]: { label: provider.label, phone: provider.phone ?? "", email: provider.email ?? "" } })); setErrors((current) => ({ ...current, [key]: "" })); }} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:text-teal-700"><SquarePen className="h-4 w-4" /></button>}</div>{errors[key] ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors[key]}</p> : null}</td>
                {row.getAllCells().map((cell) => <td key={cell.id} className="max-w-xs whitespace-nowrap px-3 py-3 text-slate-700">{draft
                  ? cell.column.id === "recordFees"
                    ? <button type="button" onClick={() => void openFees(provider)} className="font-medium text-teal-700 hover:underline">Edit fees</button>
                    : <input aria-label={String(cell.column.columnDef.header)} type={cell.column.id === "email" ? "email" : "text"} value={values[cell.column.id as keyof ProviderDraft]} onChange={(event) => updateDraft({ [cell.column.id]: event.target.value })} className={inputClass} />
                  : cell.column.id === "recordFees"
                    ? <button type="button" onClick={() => void openFees(provider)} className="font-medium text-teal-700 hover:underline">{provider.recordFees === null ? "Set fees" : Number(provider.recordFees).toFixed(2)}</button>
                    : cell.getValue() == null || cell.getValue() === "" ? "—" : String(cell.getValue())}</td>)}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
    {feesDialog ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !feesDialog.saving) setFeesDialog(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="record-fees-title" className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 id="record-fees-title" className="text-lg font-semibold text-slate-900">Record Fees</h2><p className="mt-1 text-sm text-slate-500">{feesDialog.label}</p></div><button type="button" aria-label="Close dialog" onClick={() => setFeesDialog(null)} disabled={feesDialog.saving} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X className="h-4 w-4" /></button></div>
        <div className="p-5">
          {feesDialog.loading ? <p className="py-8 text-center text-sm text-slate-500">Loading record fees...</p> : feesDialog.error ? <p role="alert" className="mb-4 text-sm text-rose-700">{feesDialog.error}</p> : <div className="space-y-3">{feesDialog.items.map((item, index) => <label key={item.recordType} className="grid grid-cols-2 items-center gap-4"><span className="text-sm font-medium text-slate-700">{recordTypes[index]?.label ?? item.recordType}</span><input type="number" min="0" step="0.01" value={item.commission} onChange={(event) => setFeesDialog((current) => current ? { ...current, items: current.items.map((value, itemIndex) => itemIndex === index ? { ...value, commission: event.target.value } : value) } : current)} aria-label={`${recordTypes[index]?.label ?? item.recordType} commission`} className={inputClass} /></label>)}</div>}
          {feesDialog.error && !feesDialog.loading ? null : <div className="mt-5 flex justify-end"><button type="button" onClick={() => void saveFees()} disabled={feesDialog.loading || feesDialog.saving || Boolean(feesDialog.error)} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{feesDialog.saving ? "Saving..." : "Save Fees"}</button></div>}
        </div>
      </section>
    </div> : null}
  </>;
}

function toProviderValues(draft: ProviderDraft) {
  const label = draft.label.trim();
  if (!label) throw new Error("Label is required.");
  return { label, phone: draft.phone.trim() || null, email: draft.email.trim() || null };
}

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The insurance provider could not be saved.";
}

function sortIcon(sorted: false | "asc" | "desc") {
  return sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />;
}
