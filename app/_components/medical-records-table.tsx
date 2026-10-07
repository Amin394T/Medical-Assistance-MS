"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw } from "lucide-react";

import type { listMedicalRecords } from "@/db/actions/medicalRecords";

type MedicalRecordListItem = Awaited<ReturnType<typeof listMedicalRecords>>[number];

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    datetime: sortFn_datetime,
    text: (rowA, rowB, columnId) => String(rowA.getValue(columnId) ?? "").localeCompare(String(rowB.getValue(columnId) ?? "")),
  },
});

const columnHelper = createColumnHelper<typeof features, MedicalRecordListItem>();

const columns = columnHelper.columns([
  columnHelper.accessor("reference", { header: "Reference", cell: ({ row, getValue }) => <Link href={`/assistance/records/${row.original.id}`} className="font-semibold text-teal-800 hover:underline">{row.original.type}-{formatReference(getValue())}</Link> }),
  columnHelper.accessor("policy", { header: "Policy Number" }),
  columnHelper.accessor("clientCompany", { header: "Client Company" }),
  columnHelper.accessor("insuranceCompany", { header: "Insurance Company" }),
  columnHelper.accessor("victimName", { header: "Victim Name", cell: ({ getValue }) => <span className="text-slate-800">{getValue()}</span> }),
  columnHelper.accessor("accidentDate", { header: "Accident Date", sortFn: "datetime", cell: ({ getValue }) => formatDateTime(getValue()) }),
  columnHelper.accessor("status", { header: "Status", cell: ({ getValue }) => <StatusBadge value={getValue()} /> }),
  columnHelper.accessor("manager", { header: "Manager", sortFn: "text" }),
]);

type MedicalRecordsTableProps = { records: MedicalRecordListItem[] };

type Filters = {
  policyNumber: string;
  clientCompany: string;
  referenceNumber: string;
  victimName: string;
  recordStatus: string;
  accidentFrom: string;
  accidentTo: string;
};

const EMPTY_FILTERS: Filters = {
  policyNumber: "",
  clientCompany: "",
  referenceNumber: "",
  victimName: "",
  recordStatus: "",
  accidentFrom: "",
  accidentTo: "",
};

export function MedicalRecordsTable({ records }: MedicalRecordsTableProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sorting, setSorting] = useState([{ id: "accidentDate", desc: true }]);
  const filteredRecords = useMemo(() => records.filter((record) => matchesFilters(record, filters)), [filters, records]);
  const table = useTable({ features, columns, data: filteredRecords, state: { sorting }, onSortingChange: setSorting, getRowId: (record) => String(record.id) });
  const updateFilter = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-5 py-5">
              <FilterInput label="Policy Number" value={filters.policyNumber} onChange={(value) => updateFilter("policyNumber", value)} />
              <FilterInput label="Client Company" value={filters.clientCompany} onChange={(value) => updateFilter("clientCompany", value)} />
              <FilterInput label="Reference" value={filters.referenceNumber} onChange={(value) => updateFilter("referenceNumber", value)} />
              <FilterInput label="Victim Name" value={filters.victimName} onChange={(value) => updateFilter("victimName", value)} />
              <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Status</span><select value={filters.recordStatus} onChange={(event) => updateFilter("recordStatus", event.target.value)} className={filterClass}><option value="">All statuses</option>{["In Progress", "Settled", "Closed", "Abandoned", "Billed"].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <DateRange label="Date" from={filters.accidentFrom} to={filters.accidentTo} onFromChange={(value) => updateFilter("accidentFrom", value)} onToChange={(value) => updateFilter("accidentTo", value)} />
              <div className="mt-5 flex justify-end"><button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setSorting([{ id: "accidentDate", desc: true }]); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5"/>Reset Table</button></div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-312.5 border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{header.isPlaceholder ? null : <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"><table.FlexRender header={header} />{sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />}</button>}</th>; })}</tr>)}</thead>
              <tbody className="divide-y divide-slate-100">{table.getRowModel().rows.length === 0 ? <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No Medical Records.</td></tr> : table.getRowModel().rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-teal-50/40">{row.getAllCells().map((cell) => <td key={cell.id} className="whitespace-nowrap px-5 py-4"><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
  );
}

function matchesFilters(record: MedicalRecordListItem, filters: Filters) {
  const textMatches = (value: string | null | undefined, filter: string) => !filter || value?.toLowerCase().includes(filter.trim().toLowerCase());
  const inDateRange = (value: Date, from: string, to: string) => {
    const timestamp = value.getTime();
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
    const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
    return timestamp >= fromTime && timestamp <= toTime;
  };

  return textMatches(record.policy, filters.policyNumber) && textMatches(record.clientCompany, filters.clientCompany) && textMatches(formatReference(record.reference), filters.referenceNumber) && textMatches(record.victimName, filters.victimName) && (!filters.recordStatus || record.status === filters.recordStatus) && inDateRange(record.accidentDate, filters.accidentFrom, filters.accidentTo);
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className={filterClass} placeholder="Any" /></label>; }

function DateRange({ label, from, to, onFromChange, onToChange }: { label: string; from: string; to: string; onFromChange: (value: string) => void; onToChange: (value: string) => void }) { return <div className="sm:col-span-2"><span className="mb-1 block text-[11px] font-semibold text-slate-500">{label} Range</span><div className="grid grid-cols-2 gap-2"><input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} className={filterClass} /><input type="date" value={to} onChange={(event) => onToChange(event.target.value)} className={filterClass} /></div></div>; }

function formatDateTime(value: Date) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value).replace(",", ""); }
function formatReference(value: number) { return String(value).slice(0, -2) + "-" + String(value).slice(-2); }

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = { "In Progress": "bg-amber-50 text-amber-700 ring-amber-600/20", Settled: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Closed: "bg-slate-100 text-slate-700 ring-slate-500/20", Abandoned: "bg-rose-50 text-rose-700 ring-rose-600/20", Billed: "bg-sky-50 text-sky-700 ring-sky-600/20" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[value] ?? "bg-slate-100 text-slate-700 ring-slate-500/20"}`}>{value}</span>;
}

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
