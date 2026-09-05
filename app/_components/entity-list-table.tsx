"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type EntityValue = string | number | boolean | Date | null;
type EntityRow = Record<string, EntityValue>;

export type EntityColumn = {
  key: string;
  label: string;
  format?: (value: EntityValue) => string;
};

type EntityListTableProps = {
  title: string;
  description: string;
  rows: EntityRow[];
  columns: EntityColumn[];
};

export function EntityListTable({ title, description, rows, columns }: EntityListTableProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(
    () => rows.filter((row) => !normalizedQuery || columns.some((column) => formatValue(row[column.key], column.format).toLowerCase().includes(normalizedQuery))),
    [columns, normalizedQuery, rows],
  );

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Reference data</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold text-slate-950">{rows.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total records</p>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">{title} list</h2>
              <p className="mt-1 text-xs text-slate-500">{filteredRows.length} records shown</p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Search {title}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search all ${title.toLowerCase()} fields`} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>{columns.map((column) => <th key={column.key} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{column.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No {title.toLowerCase()} match your search.</td></tr> : filteredRows.map((row, index) => <tr key={String(row.id ?? index)} className="transition-colors hover:bg-teal-50/40">{columns.map((column) => <td key={column.key} className="max-w-xs whitespace-nowrap px-5 py-4 text-slate-700">{formatValue(row[column.key], column.format)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatValue(value: EntityValue, formatter?: (value: EntityValue) => string) {
  if (formatter) return formatter(value);
  if (value === null) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return formatDateTime(value);
  return String(value);
}

export function formatDateTime(value: EntityValue) {
  if (!(value instanceof Date)) return value === null ? "-" : String(value);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value).replace(",", "");
}

export function formatDate(value: EntityValue) {
  if (!(value instanceof Date)) return value === null ? "-" : String(value);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

export function formatLabel(value: EntityValue) {
  if (value === null) return "-";
  return String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}
