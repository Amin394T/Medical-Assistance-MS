"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper, createSortedRowModel, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw, Save, Search, SquarePen, SquarePlus, Trash2, X } from "lucide-react";

type EntityValue = string | number | boolean | Date | null;
type EntityRow = Record<string, EntityValue> & { id: number };
type DraftValue = string | boolean;
type DraftRow = Record<string, DraftValue>;
type SelectOption = { value: string | number | null; label: string };
type EditorType = "text" | "date" | "number" | "checkbox" | "select";

export type EntityColumn = {
  key: string;
  label: string;
  format?: "date" | "label" | "policyType" | "insuranceProviderType";
  editor?: EditorType;
  options?: SelectOption[];
  required?: boolean;
  nullable?: boolean;
};

type ReferencialDataGridProps<Row extends EntityRow, CreateValues extends object> = {
  title: string;
  rows: Row[];
  columns: EntityColumn[];
  onCreate: (values: CreateValues) => Promise<unknown>;
  onUpdate: (id: number, values: Row) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
};

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    entity: (rowA, rowB, columnId) => compareValues(rowA.getValue(columnId), rowB.getValue(columnId)),
  },
});

const columnHelper = createColumnHelper<typeof features, EntityRow>();

export function ReferencialDataGrid<Row extends EntityRow, CreateValues extends object = Omit<Row, "id">>({ title, rows, columns, onCreate, onUpdate, onDelete }: ReferencialDataGridProps<Row, CreateValues>) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDraft, setNewDraft] = useState<DraftRow | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(
    () => rows.filter((row) => !normalizedQuery || columns.some((column) => formatValue(row[column.key], column).toLowerCase().includes(normalizedQuery))),
    [columns, normalizedQuery, rows],
  );
  const tableColumns = useMemo(
    () => columnHelper.columns(columns.map((column) => columnHelper.accessor((row) => row[column.key], {
      id: column.key,
      header: column.label,
      sortFn: "entity",
      cell: ({ getValue }) => formatValue(getValue(), column),
    }))),
    [columns],
  );
  const table = useTable({
    features,
    columns: tableColumns,
    data: filteredRows,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row) => String(row.id),
  });

  const saveNew = async () => {
    if (!newDraft) return;
    const key = "new";
    setSaving((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      validateDraft(newDraft, columns);
      const result = await onCreate(parseDraft(newDraft, columns) as CreateValues);
      if (result == null) throw new Error("The new row could not be created.");
      setNewDraft(null);
      router.refresh();
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: errorMessage(error) }));
    } finally {
      setSaving((current) => ({ ...current, [key]: false }));
    }
  };

  const saveRow = async (row: Row) => {
    const key = String(row.id);
    const draft = drafts[key];
    if (!draft) return;
    setSaving((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      if (deleting[key]) {
        const result = await onDelete(row.id);
        if (result == null) throw new Error("The row could not be deleted.");
      } else {
        validateDraft(draft, columns);
        const result = await onUpdate(row.id, { ...row, ...parseDraft(draft, columns) } as Row);
        if (result == null) throw new Error("The row could not be updated.");
      }
      setDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
      setDeleting((current) => { const next = { ...current }; delete next[key]; return next; });
      router.refresh();
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: errorMessage(error) }));
    } finally {
      setSaving((current) => ({ ...current, [key]: false }));
    }
  };

  const startCreate = () => {
    setNewDraft(createDraft(columns));
    setErrors((current) => ({ ...current, new: "" }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-5">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search {title}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all fields" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        </label>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => { setQuery(""); setSorting([]); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Reset Table</button>
          <button type="button" onClick={startCreate} disabled={newDraft !== null} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"><SquarePlus className="h-3.5 w-3.5" />New Record</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-semibold" />
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return <th key={header.id} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">
                    <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-600">
                      <table.FlexRender header={header} />
                      {sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />}
                    </button>
                  </th>;
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {newDraft ? <tr className="bg-teal-50/50">
              <td className="whitespace-nowrap px-5 py-3 align-top">
                <div className="flex gap-2">
                  <button type="button" aria-label="Save new row" title="Save" onClick={saveNew} disabled={saving.new} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button>
                  <button type="button" aria-label="Cancel creation" title="Delete" onClick={() => { setNewDraft(null); setErrors((current) => ({ ...current, new: "" })); }} disabled={saving.new} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                </div>
                {errors.new ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors.new}</p> : null}
              </td>
              {columns.map((column) => <td key={column.key} className="max-w-xs px-3 py-3"><GridEditor column={column} value={newDraft[column.key]} onChange={(value) => setNewDraft((current) => current ? { ...current, [column.key]: value } : current)} /></td>)}
            </tr> : null}
            {table.getRowModel().rows.length === 0 && !newDraft ? <tr><td colSpan={columns.length + 1} className="px-5 py-16 text-center text-sm text-slate-500">No {title.toLowerCase()} match your search.</td></tr> : table.getRowModel().rows.map((row) => {
              const original = row.original as Row;
              const key = String(original.id);
              const draft = drafts[key];
              const markedForDeletion = deleting[key] === true;
              return <tr key={row.id} className="transition-colors hover:bg-teal-50/40">
                <td className="whitespace-nowrap px-5 py-3 align-middle">
                  <div className="flex gap-2">
                    {draft ? <>
                      <button type="button" aria-label="Save changes" title="Save" onClick={() => void saveRow(original)} disabled={saving[key]} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button>
                      <button type="button" aria-label="Mark row for deletion" title="Delete" onClick={() => setDeleting((current) => ({ ...current, [key]: !markedForDeletion }))} disabled={saving[key] || markedForDeletion} className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"><Trash2 className="h-4 w-4" /></button>
                      <button type="button" aria-label="Cancel editing" title="Cancel" onClick={() => {
                        setDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
                        setDeleting((current) => { const next = { ...current }; delete next[key]; return next; });
                        setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
                      }} disabled={saving[key]} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><X className="h-4 w-4" /></button>
                    </> : <button type="button" aria-label="Update row" title="Update" onClick={() => { setDrafts((current) => ({ ...current, [key]: createDraft(columns, original) })); setErrors((current) => ({ ...current, [key]: "" })); }} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:text-teal-700"><SquarePen className="h-4 w-4" /></button>}
                  </div>
                  {errors[key] ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors[key]}</p> : null}
                </td>
                {row.getAllCells().map((cell, index) => {
                  const column = columns[index];
                  return <td key={cell.id} className={`max-w-xs whitespace-nowrap px-5 py-4 ${markedForDeletion ? "bg-rose-50 text-rose-800 line-through" : "text-slate-700"}`}>
                    {draft ? <GridEditor column={column} value={draft[column.key]} disabled={markedForDeletion || saving[key]} onChange={(value) => setDrafts((current) => ({ ...current, [key]: { ...current[key], [column.key]: value } }))} /> : <table.FlexRender cell={cell} />}
                  </td>;
                })}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GridEditor({ column, value, disabled, onChange }: { column: EntityColumn; value: DraftValue | undefined; disabled?: boolean; onChange: (value: DraftValue) => void }) {
  const commonClass = "h-9 w-full min-w-32 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100";
  if (column.editor === "checkbox") return <input type="checkbox" aria-label={column.label} checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-teal-700 disabled:opacity-50" />;
  if (column.editor === "select") return <select aria-label={column.label} value={String(value ?? "")} required={column.required} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={commonClass}>{column.options?.map((option) => <option key={String(option.value)} value={option.value ?? ""}>{option.label}</option>)}</select>;
  return <input type={column.editor === "date" ? "date" : column.editor === "number" ? "number" : "text"} aria-label={column.label} value={String(value ?? "")} required={column.required} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={commonClass} />;
}

function createDraft(columns: EntityColumn[], row?: EntityRow): DraftRow {
  return Object.fromEntries(columns.map((column) => {
    const value = row?.[column.key];
    if (row && column.key in row && value === null) return [column.key, ""];
    if (value instanceof Date) return [column.key, toDateInputValue(value)];
    if (value !== undefined && value !== null) return [column.key, typeof value === "boolean" ? value : String(value)];
    if (column.editor === "checkbox") return [column.key, false];
    if (column.editor === "select") {
      const defaultOption = column.options?.[0];
      return [column.key, defaultOption ? String(defaultOption.value ?? "") : ""];
    }
    return [column.key, ""];
  }));
}

function validateDraft(draft: DraftRow, columns: EntityColumn[]) {
  const missing = columns.find((column) => column.required && !String(draft[column.key] ?? "").trim());
  if (missing) throw new Error(`${missing.label} is required.`);
}

function parseDraft(draft: DraftRow, columns: EntityColumn[]): Record<string, EntityValue> {
  return Object.fromEntries(columns.map((column) => {
    const value = draft[column.key];
    if (column.editor === "checkbox") return [column.key, value === true];
    if (column.editor === "select") {
      const option = column.options?.find((item) => String(item.value ?? "") === String(value ?? ""));
      if (option?.value == null) return [column.key, null];
      return [column.key, option?.value ?? value ?? ""];
    }
    const textValue = String(value ?? "").trim();
    if (!textValue && column.nullable) return [column.key, null];
    if (column.editor === "date") return [column.key, textValue ? new Date(`${textValue}T00:00:00`) : null];
    if (column.editor === "number") return [column.key, textValue ? Number(textValue) : null];
    return [column.key, textValue];
  }));
}

function formatValue(value: EntityValue, column: EntityColumn) {
  if (column.options) return column.options.find((option) => option.value === value)?.label ?? (value === null ? "-" : String(value));
  if (value === null) return "-";
  if (column.format === "date") return formatDate(value);
  if (column.format === "label") return formatLabel(value);
  if (column.format === "policyType") return ({ REV: "Revisable", FIX: "Fixed-rate" }[String(value)] ?? String(value));
  if (column.format === "insuranceProviderType") return ({ CMP: "Company", AGT: "Agent", BRK: "Broker" }[String(value)] ?? String(value));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return formatDateTime(value);
  return String(value);
}

function formatDateTime(value: EntityValue) {
  if (!(value instanceof Date)) return value === null ? "-" : String(value);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value).replace(",", "");
}

function formatDate(value: EntityValue) {
  if (!(value instanceof Date)) return value === null ? "-" : String(value);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

function toDateInputValue(value: Date) {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function formatLabel(value: EntityValue) {
  if (value === null) return "-";
  return String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compareValues(left: EntityValue, right: EntityValue) {
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "boolean" && typeof right === "boolean") return Number(left) - Number(right);
  return String(left).localeCompare(String(right));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The change could not be saved.";
}
