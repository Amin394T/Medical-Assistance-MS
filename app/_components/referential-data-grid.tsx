"use client";

import { useMemo, useState } from "react";
import { createColumnHelper, createSortedRowModel, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw, Search } from "lucide-react";

type EntityValue = string | number | boolean | Date | null;
type EntityRow = Record<string, EntityValue>;

export type EntityColumn = {
  key: string;
  label: string;
  format?: "date" | "label" | "policyType" | "insuranceProviderType";
};

type ReferencialDataGridProps = {
  title: string;
  rows: EntityRow[];
  columns: EntityColumn[];
};

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    entity: (rowA, rowB, columnId) => compareValues(rowA.getValue(columnId), rowB.getValue(columnId)),
  },
});

const columnHelper = createColumnHelper<typeof features, EntityRow>();

export function ReferencialDataGrid({ title, rows, columns }: ReferencialDataGridProps) {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(
    () => rows.filter((row) => !normalizedQuery || columns.some((column) => formatValue(row[column.key], column.format).toLowerCase().includes(normalizedQuery))),
    [columns, normalizedQuery, rows],
  );
  const tableColumns = useMemo(
    () => columnHelper.columns(columns.map((column) => columnHelper.accessor((row) => row[column.key], {
      id: column.key,
      header: column.label,
      sortFn: "entity",
      cell: ({ getValue }) => formatValue(getValue(), column.format),
    }))),
    [columns],
  );
  const table = useTable({
    features,
    columns: tableColumns,
    data: filteredRows,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row, index) => String(row.id ?? index),
  });

  return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 px-5 py-5">
              <label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">Search {title}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all fields" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              </label>
              <button type="button" onClick={() => { setQuery(""); setSorting([]); }} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Reset Grid</button>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                {table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return <th key={header.id} scope="col" aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"} className="whitespace-nowrap px-5 py-3 font-semibold">
                    <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-600">
                      <table.FlexRender header={header} />
                      {sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-label="Sorted ascending" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" aria-label="Sorted descending" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />}
                    </button>
                  </th>;
                })}</tr>)}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.length === 0 ? <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No {title.toLowerCase()} match your search.</td></tr> : table.getRowModel().rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-teal-50/40">{row.getAllCells().map((cell) => <td key={cell.id} className="max-w-xs whitespace-nowrap px-5 py-4 text-slate-700"><table.FlexRender cell={cell} /></td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </div>
  );
}

function formatValue(value: EntityValue, formatter?: EntityColumn["format"]) {
  if (value === null) return "-";
  if (formatter === "date") return formatDate(value);
  if (formatter === "label") return formatLabel(value);
  if (formatter === "policyType") return ({ REV: "Revisable", FIX: "Fixed-rate" }[String(value)] ?? String(value));
  if (formatter === "insuranceProviderType") return ({ CMP: "Company", AGT: "Agent", BRK: "Broker" }[String(value)] ?? String(value));
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
