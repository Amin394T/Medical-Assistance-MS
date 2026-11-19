"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createColumnHelper,
  rowSortingFeature,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, RotateCcw } from "lucide-react";
import { formatDateTime } from "@/app/_lib/date-format";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";

import type { loadMedicalRecordList } from "@/app/_lib/medical-record-list";
import type { MedicalRecordFilters } from "@/db/actions/medicalRecordListTypes";

type MedicalRecordListPage = Awaited<ReturnType<typeof loadMedicalRecordList>>;
type MedicalRecordListItem = MedicalRecordListPage["records"][number];

const features = tableFeatures({
  rowSortingFeature,
  sortFns: {
    datetime: sortFn_datetime,
    text: (rowA, rowB, columnId) => String(rowA.getValue(columnId) ?? "").localeCompare(String(rowB.getValue(columnId) ?? "")),
  },
});

const columnHelper = createColumnHelper<typeof features, MedicalRecordListItem>();

const columns = columnHelper.columns([
  columnHelper.accessor("reference", { header: "Reference", cell: ({ row, getValue }) => <Link href={`/assistance/records/${row.original.id}`} className="font-semibold text-teal-800 hover:underline">{formatMedicalRecordReference(row.original.type, getValue())}</Link> }),
  columnHelper.accessor("policy", { header: "Policy Number" }),
  columnHelper.accessor("clientCompany", { header: "Client Company" }),
  columnHelper.accessor("insuranceCompany", { header: "Insurance Company" }),
  columnHelper.accessor("victimName", { header: "Victim Name", cell: ({ getValue }) => <span className="text-slate-800">{getValue()}</span> }),
  columnHelper.accessor("accidentDate", { header: "Accident Date", sortFn: "datetime", cell: ({ getValue }) => formatDateTime(getValue()) }),
  columnHelper.accessor("status", { header: "Status", cell: ({ getValue }) => <StatusBadge value={getValue()} /> }),
  columnHelper.accessor("manager", { header: "Manager", sortFn: "text" }),
]);

type MedicalRecordsTableProps = MedicalRecordListPage;

const EMPTY_FILTERS: MedicalRecordFilters = {
  policyNumber: "",
  clientCompany: "",
  referenceNumber: "",
  victimName: "",
  recordStatus: "",
  accidentFrom: "",
  accidentTo: "",
};

export function MedicalRecordsTable({ records, totalCount, page, pageSize, filters: initialFilters, sort, sortDesc }: MedicalRecordsTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [sorting, setSorting] = useState<SortingState>([{ id: sort, desc: sortDesc }]);
  const sortBy = sorting[0]?.id ?? sort;
  const sortDescending = sorting[0]?.desc ?? sortDesc;

  useEffect(() => {
    if (filtersEqual(filters, initialFilters)) return;
    const timeout = window.setTimeout(() => {
      router.replace(buildListHref(pathname, filters, 1, sortBy, sortDescending), { scroll: false });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [filters, initialFilters, pathname, router, sortBy, sortDescending]);

  const table = useTable({
    features,
    columns,
    data: records,
    state: { sorting },
    manualSorting: true,
    getRowId: (record) => String(record.id),
  });
  const updateFilter = (key: keyof MedicalRecordFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const resetTable = () => {
    setFilters(EMPTY_FILTERS);
    setSorting([{ id: "accidentDate", desc: true }]);
    router.replace(buildListHref(pathname, EMPTY_FILTERS, 1, "accidentDate", true), { scroll: false });
  };
  const toggleSort = (columnId: string) => {
    const current = sorting.find((entry) => entry.id === columnId);
    const nextSort = { id: columnId, desc: current ? !current.desc : columnId === "accidentDate" };
    setSorting([nextSort]);
    router.replace(buildListHref(pathname, filters, 1, nextSort.id, nextSort.desc), { scroll: false });
  };

  return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-5 py-5">
              <FilterInput label="Policy Number" value={filters.policyNumber} onChange={(value) => updateFilter("policyNumber", value)} />
              <FilterInput label="Client Company" value={filters.clientCompany} onChange={(value) => updateFilter("clientCompany", value)} />
              <FilterInput label="Reference" value={filters.referenceNumber} onChange={(value) => updateFilter("referenceNumber", value)} />
              <FilterInput label="Victim Name" value={filters.victimName} onChange={(value) => updateFilter("victimName", value)} />
              <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Status</span><select value={filters.recordStatus} onChange={(event) => updateFilter("recordStatus", event.target.value)} className={filterClass}><option value="">All statuses</option>{["In Progress", "Disputed", "Rejected", "Closed", "Abandoned"].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <DateRange label="Date" from={filters.accidentFrom} to={filters.accidentTo} onFromChange={(value) => updateFilter("accidentFrom", value)} onToChange={(value) => updateFilter("accidentTo", value)} />
              <div className="mt-5 flex justify-end"><button type="button" onClick={resetTable} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5"/>Reset Table</button></div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-312.5 border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{header.isPlaceholder ? null : <button type="button" onClick={() => toggleSort(header.column.id)} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"><table.FlexRender header={header} />{sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />}</button>}</th>; })}</tr>)}</thead>
              <tbody className="divide-y divide-slate-100">{table.getRowModel().rows.length === 0 ? <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No Medical Records.</td></tr> : table.getRowModel().rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-teal-50/40">{row.getAllCells().map((cell) => <td key={cell.id} className="whitespace-nowrap px-5 py-4"><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3">
              {page > 1
                ? <Link href={buildListHref(pathname, filters, page - 1, sortBy, sortDescending)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-teal-300 hover:text-teal-700">Previous</Link>
                : <span aria-disabled="true" className="rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"><ChevronLeft className="h-4 w-4" /></span>}
              <span>Page {page} / {pageCount}</span>
              {page < pageCount
                ? <Link href={buildListHref(pathname, filters, page + 1, sortBy, sortDescending)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-teal-300 hover:text-teal-700">Next</Link>
                : <span aria-disabled="true" className="rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"><ChevronRight className="h-4 w-4" /></span>}
            </div>
          </div>
        </div>
  );
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className={filterClass} placeholder="Any" /></label>; }

function DateRange({ label, from, to, onFromChange, onToChange }: { label: string; from: string; to: string; onFromChange: (value: string) => void; onToChange: (value: string) => void }) { return <div className="sm:col-span-2"><span className="mb-1 block text-[11px] font-semibold text-slate-500">{label} Range</span><div className="grid grid-cols-2 gap-2"><input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} className={filterClass} /><input type="date" value={to} onChange={(event) => onToChange(event.target.value)} className={filterClass} /></div></div>; }

function filtersEqual(left: MedicalRecordFilters, right: MedicalRecordFilters) {
  return left.policyNumber === right.policyNumber &&
    left.clientCompany === right.clientCompany &&
    left.referenceNumber === right.referenceNumber &&
    left.victimName === right.victimName &&
    left.recordStatus === right.recordStatus &&
    left.accidentFrom === right.accidentFrom &&
    left.accidentTo === right.accidentTo;
}

function buildListHref(pathname: string, filters: MedicalRecordFilters, page: number, sort: string, sortDesc: boolean) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  if (sort !== "accidentDate" || !sortDesc) {
    params.set("sort", sort);
    params.set("direction", sortDesc ? "desc" : "asc");
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    "In Progress": "bg-amber-50 text-amber-700 ring-amber-600/20",
    Disputed: "bg-violet-50 text-violet-700 ring-violet-600/20",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
    Closed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Abandoned: "bg-slate-100 text-slate-700 ring-slate-500/20",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[value] ?? "bg-slate-100 text-slate-700 ring-slate-500/20"}`}>{value}</span>;
}

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
