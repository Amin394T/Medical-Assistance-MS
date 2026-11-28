"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw, Save, SquarePen, SquarePlus, Trash2, X } from "lucide-react";
import { createColumnHelper, createSortedRowModel, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

import { createServiceType, deleteServiceType, updateServiceType } from "@/db/actions/serviceTypes";
import type { listServiceTypes } from "@/db/actions/serviceTypes";

type ServiceTypeRow = Awaited<ReturnType<typeof listServiceTypes>>[number];
type ServiceTypeDraft = { label: string; paymentAmount: string; billingAmount: string; taxRate: string; targetProfile: string };

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    text: (rowA, rowB, columnId) => String(rowA.getValue(columnId) ?? "").localeCompare(String(rowB.getValue(columnId) ?? ""), undefined, { numeric: true, sensitivity: "base" }),
  },
});

const columnHelper = createColumnHelper<typeof features, ServiceTypeRow>();
const columns = columnHelper.columns([
  columnHelper.accessor("label", { header: "Label", sortFn: "text" }),
  columnHelper.accessor("paymentAmount", { header: "Payment Amount" }),
  columnHelper.accessor("billingAmount", { header: "Billing Amount" }),
  columnHelper.accessor("taxRate", { header: "Tax Rate" }),
  columnHelper.accessor("targetProfile", { header: "Target Profile", sortFn: "text" }),
]);

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
const inputClass = "h-9 w-full min-w-32 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export function ServiceTypesTable({ rows, profiles }: { rows: ServiceTypeRow[]; profiles: string[] }) {
  const router = useRouter();
  const [labelFilter, setLabelFilter] = useState("");
  const [profileFilter, setProfileFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "targetProfile", desc: false }]);
  const [drafts, setDrafts] = useState<Record<string, ServiceTypeDraft>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [newDraft, setNewDraft] = useState<ServiceTypeDraft | null>(null);
  const [newError, setNewError] = useState("");
  const [newSaving, setNewSaving] = useState(false);

  const filteredRows = useMemo(() => rows.filter((row) =>
    row.label.toLowerCase().includes(labelFilter.trim().toLowerCase()) &&
    row.targetProfile.toLowerCase().includes(profileFilter.trim().toLowerCase()),
  ), [rows, labelFilter, profileFilter]);
  const table = useTable({ features, columns, data: filteredRows, state: { sorting } });

  const resetTable = () => {
    setLabelFilter("");
    setProfileFilter("");
    setSorting([{ id: "targetProfile", desc: false }]);
  };
  const toggleSort = (id: string) => {
    const current = sorting.find((entry) => entry.id === id);
    setSorting([{ id, desc: current ? !current.desc : false }]);
  };
  const startCreate = () => {
    setNewDraft({ label: "", paymentAmount: "0", billingAmount: "0", taxRate: "0", targetProfile: profiles[0] ?? "" });
    setNewError("");
  };
  const saveNew = async () => {
    if (!newDraft) return;
    setNewSaving(true);
    setNewError("");
    try {
      await createServiceType(toServiceTypeValues(newDraft));
      setNewDraft(null);
      router.refresh();
    } catch (error) {
      setNewError(errorMessage(error));
    } finally {
      setNewSaving(false);
    }
  };
  const saveRow = async (row: ServiceTypeRow) => {
    const key = String(row.id);
    const draft = drafts[key];
    if (!draft) return;
    setSaving((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      if (deleting[key]) {
        await deleteServiceType(row.id);
      } else {
        await updateServiceType(row.id, { id: row.id, ...toServiceTypeValues(draft) });
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

  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Label</span><input value={labelFilter} onChange={(event) => setLabelFilter(event.target.value)} className={filterClass} placeholder="Any" /></label>
      <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Target Profile</span><input value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)} className={filterClass} placeholder="Any" /></label>
      <div className="flex items-end justify-end gap-2"><button type="button" onClick={resetTable} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Reset Table</button><button type="button" onClick={startCreate} disabled={newDraft !== null} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"><SquarePlus className="h-3.5 w-3.5" />Create Service</button></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((group) => <tr key={group.id}><th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>{group.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" aria-sort={sorted === false ? "none" : sorted === "asc" ? "ascending" : "descending"} className="whitespace-nowrap px-5 py-3 font-semibold"><button type="button" onClick={() => toggleSort(header.column.id)} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"><table.FlexRender header={header} />{sortIcon(sorted)}</button></th>; })}</tr>)}</thead>
        <tbody className="divide-y divide-slate-100">
          {newDraft ? <tr className="bg-teal-50/50"><td className="whitespace-nowrap px-5 py-3 align-top"><div className="flex gap-2"><button type="button" aria-label="Save new service type" title="Save" onClick={() => void saveNew()} disabled={newSaving} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button><button type="button" aria-label="Cancel service type creation" title="Cancel" onClick={() => { setNewDraft(null); setNewError(""); }} disabled={newSaving} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>{newError ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{newError}</p> : null}</td>
            <td className="px-3 py-3"><input aria-label="Label" value={newDraft.label} onChange={(event) => setNewDraft({ ...newDraft, label: event.target.value })} className={inputClass} /></td>
            <td className="px-3 py-3"><AmountInput label="Payment Amount" value={newDraft.paymentAmount} onChange={(paymentAmount) => setNewDraft({ ...newDraft, paymentAmount })} /></td>
            <td className="px-3 py-3"><AmountInput label="Billing Amount" value={newDraft.billingAmount} onChange={(billingAmount) => setNewDraft({ ...newDraft, billingAmount })} /></td>
            <td className="px-3 py-3"><AmountInput label="Tax Rate" value={newDraft.taxRate} onChange={(taxRate) => setNewDraft({ ...newDraft, taxRate })} /></td>
            <td className="px-3 py-3"><ProfileInput value={newDraft.targetProfile} profiles={profiles} onChange={(targetProfile) => setNewDraft({ ...newDraft, targetProfile })} /></td>
          </tr> : null}
          {!table.getRowModel().rows.length && !newDraft ? <tr><td colSpan={columns.length + 1} className="px-5 py-16 text-center text-sm text-slate-500">No service types match these filters.</td></tr> : table.getRowModel().rows.map((row) => {
            const serviceType = row.original;
            const key = String(serviceType.id);
            const draft = drafts[key];
            const markedForDeletion = deleting[key] === true;
            const values = draft ?? {
              label: serviceType.label,
              paymentAmount: String(serviceType.paymentAmount),
              billingAmount: String(serviceType.billingAmount),
              taxRate: String(serviceType.taxRate),
              targetProfile: serviceType.targetProfile,
            };
            const updateDraft = (patch: Partial<ServiceTypeDraft>) => setDrafts((current) => ({ ...current, [key]: { ...values, ...patch } }));
            return <tr key={row.id} className={`transition-colors hover:bg-teal-50/40 ${markedForDeletion ? "bg-rose-50 text-rose-800" : ""}`}>
              <td className="whitespace-nowrap px-5 py-3 align-middle"><div className="flex gap-2">{draft
                ? <><button type="button" aria-label="Save service type changes" title="Save" onClick={() => void saveRow(serviceType)} disabled={saving[key]} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button><button type="button" aria-label="Mark service type for deletion" title="Delete" onClick={() => setDeleting((current) => ({ ...current, [key]: !markedForDeletion }))} disabled={saving[key] || markedForDeletion} className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button><button type="button" aria-label="Cancel service type editing" title="Cancel" onClick={() => clearRowState(key)} disabled={saving[key]} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button></>
                : <button type="button" aria-label="Edit service type" title="Edit" onClick={() => { setDrafts((current) => ({ ...current, [key]: { label: serviceType.label, paymentAmount: String(serviceType.paymentAmount), billingAmount: String(serviceType.billingAmount), taxRate: String(serviceType.taxRate), targetProfile: serviceType.targetProfile } })); setErrors((current) => ({ ...current, [key]: "" })); }} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:text-teal-700"><SquarePen className="h-4 w-4" /></button>}</div>{errors[key] ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors[key]}</p> : null}</td>
              {row.getAllCells().map((cell) => <td key={cell.id} className="max-w-xs whitespace-nowrap px-3 py-3 text-slate-700">{draft
                ? cell.column.id === "targetProfile"
                  ? <ProfileInput value={values.targetProfile} profiles={profiles} onChange={(targetProfile) => updateDraft({ targetProfile })} />
                  : cell.column.id === "label"
                    ? <input aria-label="Label" value={values.label} onChange={(event) => updateDraft({ label: event.target.value })} className={inputClass} />
                    : <AmountInput label={String(cell.column.columnDef.header)} value={values[cell.column.id as keyof ServiceTypeDraft]} onChange={(value) => updateDraft({ [cell.column.id]: value })} />
                : cell.column.id === "paymentAmount" || cell.column.id === "billingAmount" || cell.column.id === "taxRate"
                  ? Number(cell.getValue()).toFixed(2)
                  : String(cell.getValue())}</td>)}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}

function AmountInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <input type="number" min="0" step="0.01" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />;
}

function ProfileInput({ value, profiles, onChange }: { value: string; profiles: string[]; onChange: (value: string) => void }) {
  const listId = "service-type-target-profiles";
  return <><input aria-label="Target Profile" list={listId} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /><datalist id={listId}>{profiles.map((profile) => <option key={profile} value={profile} />)}</datalist></>;
}

function toServiceTypeValues(draft: ServiceTypeDraft) {
  const label = draft.label.trim();
  const targetProfile = draft.targetProfile.trim();
  const paymentAmount = Number(draft.paymentAmount);
  const billingAmount = Number(draft.billingAmount);
  const taxRate = Number(draft.taxRate);
  if (!label) throw new Error("Label is required.");
  if (!targetProfile) throw new Error("Target profile is required.");
  for (const [name, value] of [["Payment amount", paymentAmount], ["Billing amount", billingAmount], ["Tax rate", taxRate]] as const) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number.`);
  }
  return { label, paymentAmount, billingAmount, taxRate, targetProfile };
}

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The service type could not be saved.";
}

function sortIcon(sorted: false | "asc" | "desc") {
  return sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />;
}
