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
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

import type { MedicalRecord } from "@/db/schemas/medicalRecords";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { datetime: sortFn_datetime },
});

const columnHelper = createColumnHelper<typeof features, MedicalRecord>();

const columns = columnHelper.columns([
  columnHelper.accessor("referenceNumber", {
    header: "Reference",
    cell: ({ getValue }) => <span className="font-semibold text-slate-900">{getValue()}</span>,
  }),
  columnHelper.accessor((record) => `${record.victimFirstName} ${record.victimLastName}`, {
    id: "victim",
    header: "Victim",
    cell: ({ getValue }) => <span className="text-slate-800">{getValue()}</span>,
  }),
  columnHelper.accessor("accidentDate", {
    header: "Accident date",
    sortFn: "datetime",
    cell: ({ getValue }) => formatDate(getValue()),
  }),
  columnHelper.accessor("accidentType", {
    header: "Type",
    cell: ({ getValue }) => formatLabel(getValue()),
  }),
  columnHelper.accessor("accidentPlace", {
    header: "Place",
    cell: ({ getValue }) => formatLabel(getValue()),
  }),
  columnHelper.accessor("recordStatus", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge value={getValue()} tone="status" />,
  }),
  columnHelper.accessor("recordFate", {
    header: "Fate",
    cell: ({ getValue }) => <StatusBadge value={getValue()} tone="fate" />,
  }),
  columnHelper.accessor("reportingDate", {
    header: "Reported",
    sortFn: "datetime",
    cell: ({ getValue }) => formatDate(getValue()),
  }),
]);

const EMPTY_RECORDS: MedicalRecord[] = [];

type MedicalRecordsTableProps = {
  records: MedicalRecord[];
};

export function MedicalRecordsTable({ records }: MedicalRecordsTableProps) {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState([{ id: "accidentDate", desc: true }]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return records;

    return records.filter((record) =>
      [
        record.referenceNumber,
        record.victimFirstName,
        record.victimLastName,
        record.accidentType,
        record.accidentPlace,
        record.recordStatus,
        record.recordFate,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, records]);

  const table = useTable({
    features,
    columns,
    data: filteredRecords ?? EMPTY_RECORDS,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (record) => String(record.id),
  });

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Assistance / Records</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Medical records</h1>
            <p className="mt-2 text-sm text-slate-500">Monitor workplace accidents and their current resolution.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold text-slate-950">{records.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total records</p>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Record list</h2>
              <p className="mt-1 text-xs text-slate-500">{filteredRecords.length} records shown</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search medical records</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();

                      return (
                        <th key={header.id} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">
                          {header.isPlaceholder ? null : (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <table.FlexRender header={header} />
                              {sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-label="Sorted ascending" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" aria-label="Sorted descending" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" aria-label="Not sorted" />}
                            </button>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No medical records match your search.</td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-teal-50/40">
                      {row.getAllCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap px-5 py-4">
                          <table.FlexRender cell={cell} />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value);
}

function formatLabel(value: string | null) {
  return value ? value.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
}

function StatusBadge({ value, tone }: { value: string; tone: "status" | "fate" }) {
  const color = tone === "status" ? "bg-amber-50 text-amber-700 ring-amber-600/20" : "bg-sky-50 text-sky-700 ring-sky-600/20";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${color}`}>{value}</span>;
}