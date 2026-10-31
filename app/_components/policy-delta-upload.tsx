"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import { uploadPolicyDeltaFile, type PolicyDeltaImportResult } from "@/db/actions/insurancePolicyDelta";

export function PolicyDeltaUpload() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<PolicyDeltaImportResult | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");
    setResult(null);

    startTransition(async () => {
      try {
        setResult(await uploadPolicyDeltaFile(formData));
        form.reset();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The policy delta file could not be imported.");
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-teal-50 p-2 text-teal-700"><FileSpreadsheet className="h-5 w-5" /></div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Import policy delta workbook</h2>
            <p className="mt-1 text-sm text-slate-500">Upload an .xlsx file with policy, client, effective date, insurer, intermediary, and status columns.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-6">
        <label className="block max-w-2xl">
          <span className="mb-2 block text-xs font-semibold text-slate-600">Excel workbook (.xlsx)</span>
          <input name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="block w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
          <span className="mt-2 block text-xs text-slate-500">Required values: policy, client, effective date, insurer, and status. Intermediary is optional. Maximum file size: 5 MB.</span>
        </label>

        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
          <Upload className="h-3.5 w-3.5" />
          {pending ? "Importing workbook..." : "Import Delta File"}
        </button>

        {error ? <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}
        {result ? <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>Import complete: {result.policiesCreated} policies created, {result.statusesUpdated} policy statuses updated, {result.unchangedPolicies} existing policies unchanged.</span></div> : null}
      </form>
    </section>
  );
}
