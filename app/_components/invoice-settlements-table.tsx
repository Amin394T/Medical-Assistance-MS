"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw, SquarePlus } from "lucide-react";
import { createColumnHelper, createSortedRowModel, rowSortingFeature, sortFn_datetime, tableFeatures, useTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

import { formatDate } from "@/app/_lib/date-format";
import type { listInvoiceSettlements } from "@/db/actions/invoiceSettlements";

type SettlementRow = Awaited<ReturnType<typeof listInvoiceSettlements>>[number];

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    datetime: sortFn_datetime,
    text: (rowA, rowB, columnId) => String(rowA.getValue(columnId) ?? "").localeCompare(String(rowB.getValue(columnId) ?? ""), undefined, { numeric: true, sensitivity: "base" }),
  },
});

const columnHelper = createColumnHelper<typeof features, SettlementRow>();
const columns = columnHelper.columns([
  columnHelper.accessor("reference", { header: "Reference" }),
  columnHelper.accessor("serviceProvider", { header: "Service Provider", sortFn: "text" }),
  columnHelper.accessor("receptionDate", { header: "Reception Date", sortFn: "datetime" }),
  columnHelper.accessor("totalAmount", { header: "Total Amount" }),
  columnHelper.accessor("paymentMode", { header: "Payment Mode", sortFn: "text" }),
  columnHelper.accessor("paymentReference", { header: "Payment Reference", sortFn: "text" }),
  columnHelper.accessor("bank", { header: "Bank", sortFn: "text" }),
  columnHelper.accessor("settled", { header: "Settled" }),
  columnHelper.accessor("settlementDate", { header: "Settlement Date", sortFn: "datetime" }),
]);

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";

export function InvoiceSettlementsTable({ rows, providers }: { rows: SettlementRow[]; providers: string[] }) {
  const [reference, setReference] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [receptionFrom, setReceptionFrom] = useState("");
  const [receptionTo, setReceptionTo] = useState("");
  const [settled, setSettled] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "receptionDate", desc: true }]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const receptionDate = row.receptionDate ? toDateInputValue(row.receptionDate) : "";
    return String(row.reference).includes(reference.trim()) &&
      (!serviceProvider || row.serviceProvider === serviceProvider) &&
      (!receptionFrom || Boolean(receptionDate && receptionDate >= receptionFrom)) &&
      (!receptionTo || Boolean(receptionDate && receptionDate <= receptionTo)) &&
      (settled === "" || String(row.settled) === settled);
  }), [rows, reference, serviceProvider, receptionFrom, receptionTo, settled]);
  const table = useTable({ features, columns, data: filteredRows, state: { sorting } });

  const resetTable = () => {
    setReference("");
    setServiceProvider("");
    setReceptionFrom("");
    setReceptionTo("");
    setSettled("");
    setSorting([{ id: "receptionDate", desc: true }]);
  };
  const toggleSort = (id: string) => {
    const current = sorting.find((entry) => entry.id === id);
    setSorting([{ id, desc: current ? !current.desc : id === "receptionDate" }]);
  };

  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Reference</span><input value={reference} onChange={(event) => setReference(event.target.value)} className={filterClass} placeholder="Any" /></label>
      <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Service Provider</span><select value={serviceProvider} onChange={(event) => setServiceProvider(event.target.value)} className={filterClass}><option value="">All providers</option>{providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select></label>
      <div><span className="mb-1 block text-[11px] font-semibold text-slate-500">Reception Date</span><div className="grid grid-cols-2 gap-2"><input type="date" aria-label="Reception Date from" value={receptionFrom} onChange={(event) => setReceptionFrom(event.target.value)} className={filterClass} /><input type="date" aria-label="Reception Date to" value={receptionTo} onChange={(event) => setReceptionTo(event.target.value)} className={filterClass} /></div></div>
      <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Settled</span><select value={settled} onChange={(event) => setSettled(event.target.value)} className={filterClass}><option value="">All</option><option value="true">Yes</option><option value="false">No</option></select></label>
      <div className="flex items-end justify-end gap-2"><button type="button" onClick={resetTable} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Reset Table</button><Link href="/billing/settlements/new" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"><SquarePlus className="h-3.5 w-3.5" />New Settlement</Link></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" aria-sort={sorted === false ? "none" : sorted === "asc" ? "ascending" : "descending"} className="whitespace-nowrap px-5 py-3 font-semibold"><button type="button" onClick={() => toggleSort(header.column.id)} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"><table.FlexRender header={header} />{sortIcon(sorted)}</button></th>; })}</tr>)}</thead>
        <tbody className="divide-y divide-slate-100">{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-teal-50/40">{row.getAllCells().map((cell) => {
          if (cell.column.id === "reference") return <td key={cell.id} className="whitespace-nowrap px-5 py-4"><Link href={`/billing/settlements/${row.original.id}`} className="font-semibold text-teal-800 hover:underline">{String(cell.getValue())}</Link></td>;
          if (cell.column.id === "receptionDate" || cell.column.id === "settlementDate") return <td key={cell.id} className="whitespace-nowrap px-5 py-4">{cell.getValue() ? formatDate(cell.getValue() as Date) : "—"}</td>;
          if (cell.column.id === "totalAmount") return <td key={cell.id} className="whitespace-nowrap px-5 py-4">{Number(cell.getValue()).toFixed(2)}</td>;
          if (cell.column.id === "paymentMode") return <td key={cell.id} className="whitespace-nowrap px-5 py-4">{paymentModeLabel(cell.getValue())}</td>;
          if (cell.column.id === "settled") return <td key={cell.id} className="whitespace-nowrap px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cell.getValue() ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{cell.getValue() ? "Yes" : "No"}</span></td>;
          return <td key={cell.id} className="whitespace-nowrap px-5 py-4 text-slate-700">{cell.getValue() == null ? "—" : String(cell.getValue())}</td>;
        })}</tr>) : <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No settlements match these filters.</td></tr>}</tbody>
      </table>
    </div>
  </div>;
}

function paymentModeLabel(value: unknown) {
  return value === "CHQ" ? "Check" : value === "VRM" ? "Transfer" : value === "CSH" ? "Cash" : "—";
}

function toDateInputValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function sortIcon(sorted: false | "asc" | "desc") {
  return sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />;
}
