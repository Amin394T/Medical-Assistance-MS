"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Filter, RotateCcw } from "lucide-react";

import type { MedicalRecordListItem } from "@/db/actions/medicalRecords";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { datetime: sortFn_datetime },
});

const columnHelper = createColumnHelper<typeof features, MedicalRecordListItem>();

const columns = columnHelper.columns([
  columnHelper.accessor("referenceNumber", { header: "Reference", cell: ({ getValue }) => <span className="font-semibold text-slate-900">{formatReference(getValue())}</span> }),
  columnHelper.accessor("policyNumber", { header: "Policy number" }),
  columnHelper.accessor("clientCompany", { header: "Client company" }),
  columnHelper.accessor((record) => `${record.victimFirstName} ${record.victimLastName}`, { id: "victim", header: "Victim", cell: ({ getValue }) => <span className="text-slate-800">{getValue()}</span> }),
  columnHelper.accessor("victimNationalId", { header: "National ID" }),
  columnHelper.accessor("accidentDate", { header: "Accident date", sortFn: "datetime", cell: ({ getValue }) => formatDateTime(getValue()) }),
  columnHelper.accessor("recordStatus", { header: "Status", cell: ({ getValue }) => <StatusBadge value={getValue()} /> }),
  columnHelper.accessor("reportingDate", { header: "Declaration date", sortFn: "datetime", cell: ({ getValue }) => formatDateTime(getValue()) }),
  columnHelper.accessor("managedBy", { header: "Managed by", cell: ({ getValue }) => getValue() || "-" }),
]);

type MedicalRecordsTableProps = { records: MedicalRecordListItem[] };

type Filters = {
  policyNumber: string;
  clientCompany: string;
  referenceNumber: string;
  victimName: string;
  victimNationalId: string;
  recordStatus: string;
  declarationFrom: string;
  declarationTo: string;
  accidentFrom: string;
  accidentTo: string;
};

const EMPTY_FILTERS: Filters = {
  policyNumber: "",
  clientCompany: "",
  referenceNumber: "",
  victimName: "",
  victimNationalId: "",
  recordStatus: "",
  declarationFrom: "",
  declarationTo: "",
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
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Assistance</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Medical Records</h1>
          </div>
          <div className="text-left sm:text-right"><p className="text-3xl font-semibold text-slate-950">{records.length}</p><p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total records</p></div>
        </header>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-semibold text-slate-900">Record list</h2><p className="mt-1 text-xs text-slate-500">{filteredRecords.length} records shown</p></div><button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Reset filters</button></div>
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Filter className="h-3.5 w-3.5" aria-hidden="true" />Filters</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <FilterInput label="Policy number" value={filters.policyNumber} onChange={(value) => updateFilter("policyNumber", value)} />
              <FilterInput label="Client company" value={filters.clientCompany} onChange={(value) => updateFilter("clientCompany", value)} />
              <FilterInput label="Reference number" value={filters.referenceNumber} onChange={(value) => updateFilter("referenceNumber", value)} />
              <FilterInput label="Victim full name" value={filters.victimName} onChange={(value) => updateFilter("victimName", value)} />
              <FilterInput label="Victim national ID" value={filters.victimNationalId} onChange={(value) => updateFilter("victimNationalId", value)} />
              <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Record status</span><select value={filters.recordStatus} onChange={(event) => updateFilter("recordStatus", event.target.value)} className={filterClass}><option value="">All statuses</option>{["in progress", "settled", "closed", "abandoned", "billable"].map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></label>
              <DateRange label="Declaration date" from={filters.declarationFrom} to={filters.declarationTo} onFromChange={(value) => updateFilter("declarationFrom", value)} onToChange={(value) => updateFilter("declarationTo", value)} />
              <DateRange label="Accident date" from={filters.accidentFrom} to={filters.accidentTo} onFromChange={(value) => updateFilter("accidentFrom", value)} onToChange={(value) => updateFilter("accidentTo", value)} />
            </div>
          </div>

          <div className="overflow-x-auto"><table className="w-full min-w-312.5 border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{header.isPlaceholder ? null : <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"><table.FlexRender header={header} />{sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-label="Sorted ascending" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" aria-label="Sorted descending" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" aria-label="Not sorted" />}</button>}</th>; })}</tr>)}</thead><tbody className="divide-y divide-slate-100">{table.getRowModel().rows.length === 0 ? <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No medical records match these filters.</td></tr> : table.getRowModel().rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-teal-50/40">{row.getAllCells().map((cell) => <td key={cell.id} className="whitespace-nowrap px-5 py-4"><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody></table></div>
        </div>
      </div>
    </section>
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

  return textMatches(record.policyNumber, filters.policyNumber) && textMatches(record.clientCompany, filters.clientCompany) && textMatches(formatReference(record.referenceNumber), filters.referenceNumber) && textMatches(`${record.victimFirstName} ${record.victimLastName}`, filters.victimName) && textMatches(record.victimNationalId, filters.victimNationalId) && (!filters.recordStatus || record.recordStatus === filters.recordStatus) && inDateRange(record.reportingDate, filters.declarationFrom, filters.declarationTo) && inDateRange(record.accidentDate, filters.accidentFrom, filters.accidentTo);
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className={filterClass} placeholder="Any" /></label>; }

function DateRange({ label, from, to, onFromChange, onToChange }: { label: string; from: string; to: string; onFromChange: (value: string) => void; onToChange: (value: string) => void }) { return <div className="sm:col-span-2"><span className="mb-1 block text-[11px] font-semibold text-slate-500">{label} range</span><div className="grid grid-cols-2 gap-2"><input type="date" aria-label={`${label} from`} value={from} onChange={(event) => onFromChange(event.target.value)} className={filterClass} /><input type="date" aria-label={`${label} to`} value={to} onChange={(event) => onToChange(event.target.value)} className={filterClass} /></div></div>; }

function formatDateTime(value: Date) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(value).replace(",", ""); }
function formatReference(value: string) { return value.replaceAll("/", "-"); }
function formatLabel(value: string) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = { "in progress": "bg-amber-50 text-amber-700 ring-amber-600/20", settled: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", closed: "bg-slate-100 text-slate-700 ring-slate-500/20", abandoned: "bg-rose-50 text-rose-700 ring-rose-600/20", billable: "bg-violet-50 text-violet-700 ring-violet-600/20" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${colors[value] ?? "bg-slate-100 text-slate-700 ring-slate-500/20"}`}>{value}</span>;
}

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
