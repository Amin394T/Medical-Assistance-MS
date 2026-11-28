"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw, Save, SquarePen, SquarePlus, Trash2, X } from "lucide-react";
import { createColumnHelper, createSortedRowModel, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

import {
  createServiceProvider,
  deleteServiceProvider,
  updateServiceProvider,
} from "@/db/actions/serviceProviders";
import type { listServiceProviders } from "@/db/actions/serviceProviders";

type ProviderRow = Awaited<ReturnType<typeof listServiceProviders>>[number];
type ProviderDraft = { label: string; profile: string; contactName: string; phone: string; email: string };

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
  columnHelper.accessor("profile", { header: "Profile", sortFn: "text" }),
  columnHelper.accessor("contactName", { header: "Contact Name", sortFn: "text" }),
  columnHelper.accessor("phone", { header: "Phone", sortFn: "text" }),
  columnHelper.accessor("email", { header: "Email", sortFn: "text" }),
]);

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
const inputClass = "h-9 w-full min-w-32 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export function ServiceProvidersTable({ rows, profiles }: { rows: ProviderRow[]; profiles: string[] }) {
  const router = useRouter();
  const [labelFilter, setLabelFilter] = useState("");
  const [profileFilter, setProfileFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "label", desc: false }]);
  const [drafts, setDrafts] = useState<Record<string, ProviderDraft>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [newDraft, setNewDraft] = useState<ProviderDraft | null>(null);
  const [newError, setNewError] = useState("");
  const [newSaving, setNewSaving] = useState(false);

  const filteredRows = useMemo(() => rows.filter((row) =>
    row.label.toLowerCase().includes(labelFilter.trim().toLowerCase()) &&
    (!profileFilter || row.profile === profileFilter),
  ), [rows, labelFilter, profileFilter]);
  const table = useTable({ features, columns, data: filteredRows, state: { sorting } });

  const resetTable = () => {
    setLabelFilter("");
    setProfileFilter("");
    setSorting([{ id: "label", desc: false }]);
  };
  const toggleSort = (id: string) => {
    const current = sorting.find((entry) => entry.id === id);
    setSorting([{ id, desc: current ? !current.desc : false }]);
  };
  const startCreate = () => {
    setNewDraft({ label: "", profile: profiles[0] ?? "", contactName: "", phone: "", email: "" });
    setNewError("");
  };
  const saveNew = async () => {
    if (!newDraft) return;
    setNewSaving(true);
    setNewError("");
    try {
      await createServiceProvider(toProviderValues(newDraft));
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
        await deleteServiceProvider(row.id);
      } else {
        await updateServiceProvider(row.id, { id: row.id, ...toProviderValues(draft) });
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
      <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Profile</span><select value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)} className={filterClass}><option value="">All profiles</option>{profiles.map((profile) => <option key={profile} value={profile}>{formatProfile(profile)}</option>)}</select></label>
      <div className="flex items-end justify-end gap-2"><button type="button" onClick={resetTable} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Reset Table</button><button type="button" onClick={startCreate} disabled={newDraft !== null} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"><SquarePlus className="h-3.5 w-3.5" />Create Provider</button></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((group) => <tr key={group.id}><th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>{group.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" aria-sort={sorted === false ? "none" : sorted === "asc" ? "ascending" : "descending"} className="whitespace-nowrap px-5 py-3 font-semibold"><button type="button" onClick={() => toggleSort(header.column.id)} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"><table.FlexRender header={header} />{sortIcon(sorted)}</button></th>; })}</tr>)}</thead>
        <tbody className="divide-y divide-slate-100">
          {newDraft ? <tr className="bg-teal-50/50"><td className="whitespace-nowrap px-5 py-3 align-top"><div className="flex gap-2"><button type="button" aria-label="Save new provider" title="Save" onClick={() => void saveNew()} disabled={newSaving} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button><button type="button" aria-label="Cancel provider creation" title="Cancel" onClick={() => { setNewDraft(null); setNewError(""); }} disabled={newSaving} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>{newError ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{newError}</p> : null}</td>
            <td className="px-3 py-3"><input aria-label="Label" value={newDraft.label} onChange={(event) => setNewDraft({ ...newDraft, label: event.target.value })} className={inputClass} /></td>
            <td className="px-3 py-3"><ProfileInput value={newDraft.profile} profiles={profiles} onChange={(profile) => setNewDraft({ ...newDraft, profile })} /></td>
            <td className="px-3 py-3"><input aria-label="Contact Name" value={newDraft.contactName} onChange={(event) => setNewDraft({ ...newDraft, contactName: event.target.value })} className={inputClass} /></td>
            <td className="px-3 py-3"><input aria-label="Phone" value={newDraft.phone} onChange={(event) => setNewDraft({ ...newDraft, phone: event.target.value })} className={inputClass} /></td>
            <td className="px-3 py-3"><input type="email" aria-label="Email" value={newDraft.email} onChange={(event) => setNewDraft({ ...newDraft, email: event.target.value })} className={inputClass} /></td>
          </tr> : null}
          {!table.getRowModel().rows.length && !newDraft ? <tr><td colSpan={columns.length + 1} className="px-5 py-16 text-center text-sm text-slate-500">No healthcare providers match these filters.</td></tr> : table.getRowModel().rows.map((row) => {
            const provider = row.original;
            const key = String(provider.id);
            const draft = drafts[key];
            const markedForDeletion = deleting[key] === true;
            const values = draft ?? { label: provider.label, profile: provider.profile, contactName: provider.contactName ?? "", phone: provider.phone, email: provider.email ?? "" };
            const updateDraft = (patch: Partial<ProviderDraft>) => setDrafts((current) => ({ ...current, [key]: { ...values, ...patch } }));
            return <tr key={row.id} className={`transition-colors hover:bg-teal-50/40 ${markedForDeletion ? "bg-rose-50 text-rose-800" : ""}`}>
              <td className="whitespace-nowrap px-5 py-3 align-middle"><div className="flex gap-2">{draft
                ? <><button type="button" aria-label="Save provider changes" title="Save" onClick={() => void saveRow(provider)} disabled={saving[key]} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button><button type="button" aria-label="Mark provider for deletion" title="Delete" onClick={() => setDeleting((current) => ({ ...current, [key]: !markedForDeletion }))} disabled={saving[key] || markedForDeletion} className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button><button type="button" aria-label="Cancel provider editing" title="Cancel" onClick={() => clearRowState(key)} disabled={saving[key]} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button></>
                : <button type="button" aria-label="Edit provider" title="Edit" onClick={() => { setDrafts((current) => ({ ...current, [key]: { label: provider.label, profile: provider.profile, contactName: provider.contactName ?? "", phone: provider.phone, email: provider.email ?? "" } })); setErrors((current) => ({ ...current, [key]: "" })); }} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:text-teal-700"><SquarePen className="h-4 w-4" /></button>}</div>{errors[key] ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors[key]}</p> : null}</td>
              {row.getAllCells().map((cell) => <td key={cell.id} className="max-w-xs whitespace-nowrap px-3 py-3 text-slate-700">{draft
                ? cell.column.id === "profile"
                  ? <ProfileInput value={values.profile} profiles={profiles} onChange={(profile) => updateDraft({ profile })} />
                  : <input aria-label={String(cell.column.columnDef.header)} type={cell.column.id === "email" ? "email" : "text"} value={values[cell.column.id as keyof ProviderDraft]} onChange={(event) => updateDraft({ [cell.column.id]: event.target.value })} className={inputClass} />
                : cell.column.id === "profile" ? formatProfile(provider.profile) : (cell.getValue() == null || cell.getValue() === "" ? "—" : String(cell.getValue()))}</td>)}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}

function ProfileInput({ value, profiles, onChange }: { value: string; profiles: string[]; onChange: (value: string) => void }) {
  return <select aria-label="Profile" value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{profiles.map((profile) => <option key={profile} value={profile}>{formatProfile(profile)}</option>)}</select>;
}

function formatProfile(profile: string) {
  return profile.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toProviderValues(draft: ProviderDraft) {
  const label = draft.label.trim();
  const profile = draft.profile.trim();
  const phone = draft.phone.trim();
  if (!label) throw new Error("Label is required.");
  if (!profile) throw new Error("Profile is required.");
  if (!phone) throw new Error("Phone is required.");
  return { label, profile, contactName: draft.contactName.trim() || null, phone, email: draft.email.trim() || null };
}

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The provider could not be saved.";
}

function sortIcon(sorted: false | "asc" | "desc") {
  return sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />;
}
