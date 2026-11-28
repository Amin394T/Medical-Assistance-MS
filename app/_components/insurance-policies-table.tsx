"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

import { formatDate, formatDateTime } from "@/app/_lib/date-format";
import { listInsurancePolicyEmployees } from "@/db/actions/insurancePolicies";
import type { listInsurancePolicies } from "@/db/actions/insurancePolicies";

type PolicyRow = Awaited<ReturnType<typeof listInsurancePolicies>>[number];

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    datetime: sortFn_datetime,
    text: (rowA, rowB, columnId) => String(rowA.getValue(columnId) ?? "").localeCompare(String(rowB.getValue(columnId) ?? ""), undefined, { numeric: true, sensitivity: "base" }),
  },
});

const columnHelper = createColumnHelper<typeof features, PolicyRow>();
const columns = columnHelper.columns([
  columnHelper.accessor("policyNumber", { header: "Policy Number", sortFn: "text" }),
  columnHelper.accessor("clientCompany", { header: "Client Company", sortFn: "text" }),
  columnHelper.accessor("clientActivity", { header: "Client Activity", sortFn: "text" }),
  columnHelper.accessor("clientAddress", { header: "Client Address", sortFn: "text" }),
  columnHelper.accessor("clientCity", { header: "Client City", sortFn: "text" }),
  columnHelper.accessor("type", { header: "Type", sortFn: "text" }),
  columnHelper.accessor("status", { header: "Status", sortFn: "text" }),
  columnHelper.accessor("statusDate", { header: "Status Date", sortFn: "datetime" }),
  columnHelper.accessor("uploadDate", { header: "Upload Date", sortFn: "datetime" }),
  columnHelper.accessor("insuranceCompany", { header: "Insurance Company", sortFn: "text" }),
]);

const statusLabels: Record<PolicyRow["status"], string> = {
  VLD: "Valid",
  SPD: "Suspended",
  TRM: "Terminated",
};

const statusClasses: Record<PolicyRow["status"], string> = {
  VLD: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  SPD: "bg-amber-50 text-amber-700 ring-amber-600/20",
  TRM: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const filterClass = "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";

export function InsurancePoliciesTable({ rows }: { rows: PolicyRow[] }) {
  const [policyNumber, setPolicyNumber] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [status, setStatus] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "statusDate", desc: true }]);
  const [dialog, setDialog] = useState<{ policyId: number; employees: string[]; loading: boolean; error: string } | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState("");

  const filteredRows = useMemo(() => rows.filter((row) =>
    row.policyNumber.toLowerCase().includes(policyNumber.trim().toLowerCase()) &&
    row.clientCompany.toLowerCase().includes(clientCompany.trim().toLowerCase()) &&
    (!status || row.status === status),
  ), [rows, policyNumber, clientCompany, status]);

  const table = useTable({ features, columns, data: filteredRows, state: { sorting } });

  const resetTable = () => {
    setPolicyNumber("");
    setClientCompany("");
    setStatus("");
    setSorting([{ id: "statusDate", desc: true }]);
  };

  const openEmployees = async (policyId: number) => {
    setEmployeeQuery("");
    setDialog({ policyId, employees: [], loading: true, error: "" });
    try {
      const employees = await listInsurancePolicyEmployees(policyId);
      setDialog((current) => current?.policyId === policyId ? { ...current, employees, loading: false } : current);
    } catch (error) {
      setDialog((current) => current?.policyId === policyId
        ? { ...current, loading: false, error: error instanceof Error ? error.message : "Unable to load covered employees." }
        : current);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Policy Number</span><input value={policyNumber} onChange={(event) => setPolicyNumber(event.target.value)} className={filterClass} placeholder="Any" /></label>
          <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Client Company</span><input value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} className={filterClass} placeholder="Any" /></label>
          <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-500">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className={filterClass}><option value="">All statuses</option><option value="VLD">Valid</option><option value="SPD">Suspended</option><option value="TRM">Terminated</option></select></label>
          <div className="flex items-end justify-end"><button type="button" onClick={resetTable} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Reset Table</button></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return <th key={header.id} scope="col" aria-sort={sorted === false ? "none" : sorted === "asc" ? "ascending" : "descending"} className="whitespace-nowrap px-5 py-3 font-semibold"><button type="button" onClick={() => toggleSort(setSorting, sorting, header.column.id, "statusDate")} className="inline-flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"><table.FlexRender header={header} />{sortIcon(sorted)}</button></th>;
              })}</tr>)}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => {
                const policy = row.original;
                return <tr key={row.id} className="transition-colors hover:bg-teal-50/40">{row.getAllCells().map((cell) => {
                  const value = cell.getValue();
                  if (cell.column.id === "type") return <td key={cell.id} className="whitespace-nowrap px-5 py-4">{policy.type === "NMT"
                    ? <button type="button" onClick={() => void openEmployees(policy.id)} className="font-medium text-teal-700 hover:underline">Nominative</button>
                    : "Global"}</td>;
                  if (cell.column.id === "status") return <td key={cell.id} className="whitespace-nowrap px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses[policy.status]}`}>{statusLabels[policy.status]}</span></td>;
                  if (cell.column.id === "statusDate") return <td key={cell.id} className="whitespace-nowrap px-5 py-4">{formatDate(value as Date)}</td>;
                  if (cell.column.id === "uploadDate") return <td key={cell.id} className="whitespace-nowrap px-5 py-4">{formatDateTime(value as Date)}</td>;
                  return <td key={cell.id} className="whitespace-nowrap px-5 py-4 text-slate-700">{value == null ? "—" : String(value)}</td>;
                })}</tr>;
              }) : <tr><td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-slate-500">No Client Policies.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {dialog ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="covered-employees-title" className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div><h2 id="covered-employees-title" className="text-lg font-semibold text-slate-900">Covered Employees</h2><p className="mt-1 text-sm text-slate-500">{dialog.loading ? "Loading..." : dialog.error || `${dialog.employees.length} employees`}</p></div>
            <button type="button" aria-label="Close dialog" onClick={() => setDialog(null)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-5">
            <label className="relative block"><span className="sr-only">Search covered employees</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={employeeQuery} onChange={(event) => setEmployeeQuery(event.target.value)} disabled={dialog.loading || Boolean(dialog.error)} placeholder="Search covered employees" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:opacity-50" /></label>
            <ul className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {!dialog.loading && !dialog.error && dialog.employees.filter((employee) => employee.toLowerCase().includes(employeeQuery.trim().toLowerCase())).map((employee, index) => <li key={`${employee}-${index}`} className="px-4 py-3 text-sm text-slate-700">{employee}</li>)}
              {dialog.loading ? <li className="px-4 py-8 text-center text-sm text-slate-500">Loading covered employees...</li> : null}
              {dialog.error ? <li role="alert" className="px-4 py-8 text-center text-sm text-rose-700">{dialog.error}</li> : null}
              {!dialog.loading && !dialog.error && !dialog.employees.some((employee) => employee.toLowerCase().includes(employeeQuery.trim().toLowerCase())) ? <li className="px-4 py-8 text-center text-sm text-slate-500">{dialog.employees.length ? "No employees match your search." : "No covered employees are listed for this policy."}</li> : null}
            </ul>
          </div>
        </section>
      </div> : null}
    </>
  );
}

function toggleSort(setSorting: (sorting: SortingState) => void, sorting: SortingState, id: string, defaultDesc: string) {
  const current = sorting.find((entry) => entry.id === id);
  setSorting([{ id, desc: current ? !current.desc : id === defaultDesc }]);
}

function sortIcon(sorted: false | "asc" | "desc") {
  return sorted === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />;
}
