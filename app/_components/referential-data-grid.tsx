"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createColumnHelper, createSortedRowModel, rowSelectionFeature, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Eye, RotateCcw, Save, Search, SquarePen, SquarePlus, Trash2, X } from "lucide-react";
import { formatDate, formatDateTime } from "@/app/_lib/date-format";

type EntityValue = string | number | boolean | Date | null;
type EntityRow = Record<string, EntityValue> & { id: number };
type DraftValue = string | boolean;
type DraftRow = Record<string, DraftValue>;
type SelectOption = { value: string | number | null; label: string };
type EditorType = "text" | "date" | "number" | "checkbox" | "select" | "combo-box";

export type EntityColumn = {
  key: string;
  label: string;
  format?: "date" | "datetime" | "label" | "policyType";
  editor?: EditorType;
  options?: SelectOption[];
  optionsBy?: { dependencyKey: string; values: Record<string, SelectOption[]> };
  defaultFieldsByOption?: { fieldKey: string; values: Record<string, number> }[];
  required?: boolean;
  nullable?: boolean;
  readOnly?: boolean;
  badgeClasses?: Record<string, string>;
  dialogTitle?: string;
  dialogValues?: EntityValue[];
  linkHrefKey?: string;
};

type ReferencialDataGridProps<Row extends EntityRow, CreateValues extends object> = {
  title: string;
  rows: Row[];
  columns: EntityColumn[];
  onCreate?: (values: CreateValues) => Promise<unknown>;
  onUpdate?: (id: number, values: Row) => Promise<unknown>;
  onDelete?: (id: number) => Promise<unknown>;
  readOnly?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  detailsHrefPrefix?: string;
  createHref?: string;
  createLabel?: string;
  initialSearch?: string;
  serverPagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    sort: string;
    sortDesc: boolean;
    defaultSort: string;
    defaultSortDesc: boolean;
  };
  loadDialogItems?: (id: number) => Promise<string[]>;
  selection?: {
    key: string;
    selectableValues: EntityValue[];
    actionLabel: string;
    onAction: (ids: number[]) => Promise<unknown>;
  };
};

const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    entity: (rowA, rowB, columnId) => compareValues(rowA.getValue(columnId), rowB.getValue(columnId)),
  },
});

const columnHelper = createColumnHelper<typeof features, EntityRow>();

export function ReferencialDataGrid<Row extends EntityRow, CreateValues extends object = Omit<Row, "id">>({ title, rows, columns, onCreate, onUpdate, onDelete, readOnly = false, canCreate = true, canDelete = true, detailsHrefPrefix, createHref, createLabel = "Nouvel Enregistrement", initialSearch = "", serverPagination, loadDialogItems, selection }: ReferencialDataGridProps<Row, CreateValues>) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>(
    serverPagination ? [{ id: serverPagination.sort, desc: serverPagination.sortDesc }] : [],
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDraft, setNewDraft] = useState<DraftRow | null>(null);
  const [selectionPending, setSelectionPending] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [dialog, setDialog] = useState<{ key: string; title: string; items: string[]; loading: boolean; error: string } | null>(null);
  const [dialogQuery, setDialogQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(
    () => serverPagination ? rows : rows.filter((row) => !normalizedQuery || columns.some((column) =>
      formatValue(row[column.key], { ...column, options: resolveOptions(column, row) }).toLowerCase().includes(normalizedQuery))),
    [columns, normalizedQuery, rows, serverPagination],
  );
  const tableColumns = useMemo(
    () => columnHelper.columns(columns.map((column) => columnHelper.accessor((row) => row[column.key], {
      id: column.key,
      header: column.label,
      sortFn: "entity",
      cell: ({ getValue, row }) => {
        const value = getValue();
        if (column.editor === "checkbox" && column.readOnly) {
          return <input type="checkbox" checked={value === true} disabled aria-label={column.label} className="h-4 w-4 accent-teal-700 disabled:opacity-100" />;
        }
        const formatted = formatValue(value, { ...column, options: resolveOptions(column, row.original) });
        const badgeClass = value === null ? undefined : column.badgeClasses?.[String(value)];
        const content = badgeClass
          ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}>{formatted}</span>
          : formatted;
        const href = column.linkHrefKey ? row.original[column.linkHrefKey] : null;
        return typeof href === "string" && value !== null
          ? <Link href={href} className="font-medium text-teal-700 hover:text-teal-900">{content}</Link>
          : content;
      },
    }))),
    [columns],
  );
  const table = useTable({
    features,
    columns: tableColumns,
    data: filteredRows,
    state: { sorting, rowSelection },
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(nextSorting);
      if (!serverPagination) return;
      const nextSort = nextSorting[0] ?? {
        id: serverPagination.defaultSort,
        desc: serverPagination.defaultSortDesc,
      };
      router.replace(buildGridHref(pathname, query, 1, nextSort.id, nextSort.desc), { scroll: false });
    },
    manualSorting: Boolean(serverPagination),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selection
      ? (row) => selection.selectableValues.includes(row.original[selection.key])
      : false,
    getRowId: (row) => String(row.id),
  });
  const selectedIds = serverPagination
    ? Object.keys(rowSelection).filter((id) => rowSelection[id]).map(Number).filter(Number.isInteger)
    : table.getSelectedRowIds().map(Number).filter(Number.isInteger);

  useEffect(() => {
    if (!serverPagination || query === initialSearch) return;
    const activeSort = sorting[0] ?? {
      id: serverPagination.defaultSort,
      desc: serverPagination.defaultSortDesc,
    };
    const timeout = window.setTimeout(() => {
      router.replace(buildGridHref(pathname, query, 1, activeSort.id, activeSort.desc), { scroll: false });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [
    initialSearch,
    pathname,
    query,
    router,
    serverPagination,
    sorting,
  ]);

  const saveNew = async () => {
    if (!newDraft) return;
    const key = "new";
    setSaving((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      validateDraft(newDraft, columns);
      if (!onCreate) throw new Error("Creating rows is not available.");
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
        if (!onDelete) throw new Error("Deleting rows is not available.");
        const result = await onDelete(row.id);
        if (result == null) throw new Error("The row could not be deleted.");
      } else {
        if (!onUpdate) throw new Error("Updating rows is not available.");
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

  const runSelectionAction = async () => {
    if (!selection) return;
    const ids = selectedIds;
    if (!ids.length) return;
    setSelectionPending(true);
    setSelectionError("");
    try {
      const result = await selection.onAction(ids);
      if (result == null) throw new Error("The selected rows could not be processed.");
      setRowSelection({});
      router.refresh();
    } catch (error) {
      setSelectionError(errorMessage(error));
    } finally {
      setSelectionPending(false);
    }
  };

  const resetTable = () => {
    setQuery("");
    setSorting(serverPagination ? [{
      id: serverPagination.defaultSort,
      desc: serverPagination.defaultSortDesc,
    }] : []);
    setRowSelection({});
    if (serverPagination) {
      router.replace(buildGridHref(
        pathname,
        "",
        1,
        serverPagination.defaultSort,
        serverPagination.defaultSortDesc,
      ), { scroll: false });
    }
  };

  const openDialog = async (row: Row, column: EntityColumn) => {
    if (!loadDialogItems || !column.dialogTitle) return;
    const key = `${row.id}:${column.key}`;
    setDialog({
      key,
      title: `${column.dialogTitle} — ${formatValue(row[column.key], column)}`,
      items: [],
      loading: true,
      error: "",
    });
    setDialogQuery("");
    try {
      const items = await loadDialogItems(row.id);
      setDialog((current) => current?.key === key ? { ...current, items, loading: false } : current);
    } catch (error) {
      setDialog((current) => current?.key === key ? { ...current, loading: false, error: errorMessage(error) } : current);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-5">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Rechercher : {title}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans Tous les Champs" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        </label>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={resetTable} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700"><RotateCcw className="h-3.5 w-3.5" />Réinitialiser le Tableau</button>
          {selection && <button type="button" onClick={() => void runSelectionAction()} disabled={selectionPending || !selectedIds.length} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{selectionPending ? "Traitement..." : selection.actionLabel} ({selectedIds.length})</button>}
          {createHref ? <Link href={createHref} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"><SquarePlus className="h-3.5 w-3.5" />{createLabel}</Link> : null}
          {!readOnly && canCreate && !createHref && <button type="button" onClick={startCreate} disabled={newDraft !== null} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"><SquarePlus className="h-3.5 w-3.5" />{createLabel}</button>}
        </div>
      </div>
      {selectionError ? <p role="alert" className="px-5 pb-3 text-sm text-rose-700">{selectionError}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th scope="col" className="whitespace-nowrap px-5 py-3 font-semibold" />
                {selection ?                 <th scope="col" className="px-3 py-3 text-center"><span className="sr-only">Sélectionner</span></th> : null}
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
                  <button type="button" aria-label="Enregistrer la Nouvelle Ligne" title="Enregistrer" onClick={saveNew} disabled={saving.new} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button>
                  <button type="button" aria-label="Annuler la Création" title="Supprimer" onClick={() => { setNewDraft(null); setErrors((current) => ({ ...current, new: "" })); }} disabled={saving.new} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                </div>
                {errors.new ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors.new}</p> : null}
              </td>
              {columns.map((column) => <td key={column.key} className="max-w-xs px-3 py-3">{column.readOnly ? <span className="text-xs text-slate-400">Automatique</span> : <GridEditor column={{ ...column, options: resolveOptions(column, newDraft) }} value={newDraft[column.key]} onChange={(value) => setNewDraft((current) => current ? updateDraft(current, column, value, columns, true) : current)} />}</td>)}
            </tr> : null}
            {table.getRowModel().rows.length === 0 && !newDraft ? <tr><td colSpan={columns.length + 1 + Number(Boolean(selection))} className="px-5 py-16 text-center text-sm text-slate-500">No {title.toLowerCase()} match your search.</td></tr> : table.getRowModel().rows.map((row) => {
              const original = row.original as Row;
              const key = String(original.id);
              const draft = drafts[key];
              const markedForDeletion = deleting[key] === true;
              return <tr key={row.id} className="transition-colors hover:bg-teal-50/40">
                <td className="whitespace-nowrap px-5 py-3 align-middle">
                  <div className="flex gap-2">
                    {readOnly && detailsHrefPrefix ? <Link href={`${detailsHrefPrefix}/${row.id}`} aria-label={`Voir les Détails de ${title}`} title="Voir les Détails" className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:text-teal-700"><Eye className="h-4 w-4" /></Link> : null}
                    {!readOnly && draft ? <>
                      <button type="button" aria-label="Enregistrer les Modifications" title="Enregistrer" onClick={() => void saveRow(original)} disabled={saving[key]} className="rounded-md bg-teal-700 p-1.5 text-white hover:bg-teal-800 disabled:opacity-50"><Save className="h-4 w-4" /></button>
                      {canDelete && <button type="button" aria-label="Marquer la Ligne pour Suppression" title="Supprimer" onClick={() => setDeleting((current) => ({ ...current, [key]: !markedForDeletion }))} disabled={saving[key] || markedForDeletion} className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"><Trash2 className="h-4 w-4" /></button>}
                      <button type="button" aria-label="Annuler la Modification" title="Annuler" onClick={() => {
                        setDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
                        setDeleting((current) => { const next = { ...current }; delete next[key]; return next; });
                        setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
                      }} disabled={saving[key]} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"><X className="h-4 w-4" /></button>
                    </> : !readOnly ? <button type="button" aria-label="Modifier la Ligne" title="Modifier" onClick={() => { setDrafts((current) => ({ ...current, [key]: createDraft(columns, original) })); setErrors((current) => ({ ...current, [key]: "" })); }} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:text-teal-700"><SquarePen className="h-4 w-4" /></button> : null}
                  </div>
                  {errors[key] ? <p role="alert" className="mt-2 max-w-48 whitespace-normal text-xs text-rose-700">{errors[key]}</p> : null}
                </td>
                {selection ? <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label={`Sélectionner la ligne ${row.id}`}
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect() || selectionPending || Boolean(draft)}
                    onClick={row.getToggleSelectedHandler()}
                    onChange={() => {}}
                    className="h-4 w-4 accent-teal-700 disabled:opacity-40"
                  />
                </td> : null}
                {row.getAllCells().map((cell, index) => {
                  const column = columns[index];
                  const canOpenDialog = Boolean(column.dialogTitle && column.dialogValues?.includes(original[column.key]) && loadDialogItems);
                  return <td key={cell.id} className={`max-w-xs whitespace-nowrap px-5 py-4 ${markedForDeletion ? "bg-rose-50 text-rose-800" : "text-slate-700"}`}>
                    {draft && !readOnly ? column.readOnly
                      ? formatValue(original[column.key], { ...column, options: resolveOptions(column, original) })
                      : <GridEditor column={{ ...column, options: resolveOptions(column, draft) }} value={draft[column.key]} disabled={markedForDeletion || saving[key]} onChange={(value) => setDrafts((current) => ({ ...current, [key]: updateDraft(current[key], column, value, columns, false) }))} />
                      : canOpenDialog
                        ? <button type="button" onClick={() => void openDialog(original, column)} className="cursor-pointer font-medium text-teal-700 hover:text-teal-900">{formatValue(original[column.key], column)}</button>
                        : <table.FlexRender cell={cell} />}
                  </td>;
                })}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {serverPagination ? <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-3">
          {serverPagination.page > 1
            ? <Link href={buildGridHref(pathname, query, serverPagination.page - 1, sorting[0]?.id ?? serverPagination.sort, sorting[0]?.desc ?? serverPagination.sortDesc)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-teal-300 hover:text-teal-700">Précédent</Link>
            : <span aria-disabled="true" className="rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"><ChevronLeft className="h-4 w-4" /></span>}
          <span>Page {serverPagination.page} / {Math.max(1, Math.ceil(serverPagination.totalCount / serverPagination.pageSize))}</span>
          {serverPagination.page * serverPagination.pageSize < serverPagination.totalCount
            ? <Link href={buildGridHref(pathname, query, serverPagination.page + 1, sorting[0]?.id ?? serverPagination.sort, sorting[0]?.desc ?? serverPagination.sortDesc)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-teal-300 hover:text-teal-700">Suivant</Link>
            : <span aria-disabled="true" className="rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-400"><ChevronRight className="h-4 w-4" /></span>}
        </div>
      </div> : null}
      {dialog ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <section role="dialog" aria-modal="true" aria-labelledby="grid-dialog-title" className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 id="grid-dialog-title" className="text-lg font-semibold text-slate-900">{dialog.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{dialog.loading ? "Chargement des employés couverts..." : dialog.error || `${dialog.items.length} employés couverts`}</p>
            </div>
            <button type="button" aria-label="Fermer la fenêtre" onClick={() => setDialog(null)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-5">
            <label className="relative block">
              <span className="sr-only">Rechercher parmi les Employés Couverts</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={dialogQuery} onChange={(event) => setDialogQuery(event.target.value)} disabled={dialog.loading || Boolean(dialog.error)} placeholder="Rechercher parmi les Employés Couverts" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:opacity-50" />
            </label>
            <ul className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {!dialog.loading && !dialog.error && dialog.items.filter((employee) => employee.toLowerCase().includes(dialogQuery.trim().toLowerCase())).map((employee, index) => (
                <li key={`${employee}-${index}`} className="px-4 py-3 text-sm text-slate-700">{employee}</li>
              ))}
              {dialog.loading
                ? <li className="px-4 py-8 text-center text-sm text-slate-500">Chargement des employés couverts...</li>
                : dialog.error
                  ? <li role="alert" className="px-4 py-8 text-center text-sm text-rose-700">{dialog.error}</li>
                  : dialog.items.filter((employee) => employee.toLowerCase().includes(dialogQuery.trim().toLowerCase())).length === 0
                    ? <li className="px-4 py-8 text-center text-sm text-slate-500">{dialog.items.length ? "Aucun employé ne correspond à votre recherche." : "Aucun employé couvert n’est répertorié pour cette police."}</li>
                : null}
            </ul>
          </div>
        </section>
      </div> : null}
    </div>
  );
}

function GridEditor({ column, value, disabled, onChange }: { column: EntityColumn; value: DraftValue | undefined; disabled?: boolean; onChange: (value: DraftValue) => void }) {
  const listId = useId();
  const commonClass = "h-9 w-full min-w-32 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100";
  if (column.editor === "checkbox") return <input type="checkbox" aria-label={column.label} checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-teal-700 disabled:opacity-50" />;
  if (column.editor === "select") return <select aria-label={column.label} value={String(value ?? "")} required={column.required} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={commonClass}>{column.options?.map((option) => <option key={String(option.value)} value={option.value ?? ""}>{option.label}</option>)}</select>;
  if (column.editor === "combo-box") return <><input type="text" aria-label={column.label} list={listId} value={String(value ?? "")} required={column.required} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={commonClass} /><datalist id={listId}>{column.options?.map((option) => <option key={String(option.value)} value={option.value ?? ""}>{option.label}</option>)}</datalist></>;
  return <input type={column.editor === "date" ? "date" : column.editor === "number" ? "number" : "text"} aria-label={column.label} value={String(value ?? "")} required={column.required} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={commonClass} />;
}

function createDraft(columns: EntityColumn[], row?: EntityRow): DraftRow {
  const draft = Object.fromEntries(columns.map((column) => {
    const value = row?.[column.key];
    if (row && column.key in row && value === null) return [column.key, ""];
    if (value instanceof Date) return [column.key, toDateInputValue(value)];
    if (value !== undefined && value !== null) return [column.key, typeof value === "boolean" ? value : String(value)];
    if (column.editor === "checkbox") return [column.key, false];
    if (column.editor === "select" && column.options?.length) return [column.key, String(column.options[0]?.value ?? "")];
    return [column.key, ""];
  }));
  for (const column of columns) {
    if (column.editor === "select" && !draft[column.key]) {
      const option = resolveOptions(column, { ...row, ...draft })[0];
      if (option) draft[column.key] = String(option.value ?? "");
    }
    if (!row && column.defaultFieldsByOption) {
      for (const { fieldKey, values } of column.defaultFieldsByOption) {
        const defaultValue = values[String(draft[column.key] ?? "")];
        if (defaultValue !== undefined) draft[fieldKey] = String(defaultValue);
      }
    }
  }
  return draft;
}

function validateDraft(draft: DraftRow, columns: EntityColumn[]) {
  const missing = columns.find((column) => !column.readOnly && column.required && !String(draft[column.key] ?? "").trim());
  if (missing) throw new Error(`${missing.label} is required.`);
}

function parseDraft(draft: DraftRow, columns: EntityColumn[]): Record<string, EntityValue> {
  return Object.fromEntries(columns.filter((column) => !column.readOnly).map((column) => {
    const value = draft[column.key];
    if (column.editor === "checkbox") return [column.key, value === true];
    if (column.editor === "select") {
      const option = resolveOptions(column, draft).find((item) => String(item.value ?? "") === String(value ?? ""));
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
  if (column.options?.length) return column.options.find((option) => option.value === value)?.label ?? (value === null ? "-" : String(value));
  if (value === null) return "-";
  if (column.format === "date") return value instanceof Date || typeof value === "string" ? formatDate(value) : String(value);
  if (column.format === "datetime") return value instanceof Date || typeof value === "string" ? formatDateTime(value) : String(value);
  if (column.format === "label") return formatLabel(value);
  if (column.format === "policyType") return ({ REV: "Révisable", FIX: "Forfaitaire" }[String(value)] ?? String(value));
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value instanceof Date) return formatDateTime(value);
  return String(value);
}

function resolveOptions(column: EntityColumn, values?: Record<string, unknown>) {
  if (!column.optionsBy) return column.options ?? [];
  return column.optionsBy.values[String(values?.[column.optionsBy.dependencyKey] ?? "")] ?? [];
}

function updateDraft(draft: DraftRow, column: EntityColumn, value: DraftValue, columns: EntityColumn[], isNew: boolean): DraftRow {
  const updated = { ...draft, [column.key]: value };
  for (const dependent of columns) {
    if (dependent.optionsBy?.dependencyKey === column.key) {
      const options = resolveOptions(dependent, updated);
      if (!options.some((option) => String(option.value ?? "") === String(updated[dependent.key] ?? ""))) {
        updated[dependent.key] = String(options[0]?.value ?? "");
        if (isNew && dependent.defaultFieldsByOption) {
          for (const { fieldKey, values } of dependent.defaultFieldsByOption) {
            const defaultValue = values[String(updated[dependent.key])];
            if (defaultValue !== undefined) updated[fieldKey] = String(defaultValue);
          }
        }
      }
    }
    if (isNew && dependent.defaultFieldsByOption && dependent.key === column.key) {
      for (const { fieldKey, values } of dependent.defaultFieldsByOption) {
        const defaultValue = values[String(value)];
        if (defaultValue !== undefined) updated[fieldKey] = String(defaultValue);
      }
    }
  }
  return updated;
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

function buildGridHref(pathname: string, search: string, page: number, sort: string, sortDesc: boolean) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  params.set("sort", sort);
  params.set("direction", sortDesc ? "desc" : "asc");
  return `${pathname}?${params.toString()}`;
}
