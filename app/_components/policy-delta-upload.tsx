"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

import { uploadPolicyDeltaFiles, type PolicyDeltaImportResult } from "@/db/actions/insurancePolicyDelta";

type ProviderOption = { id: number; label: string };

export function PolicyDeltaUpload({ providers }: { providers: ProviderOption[] }) {
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
        setResult(await uploadPolicyDeltaFiles(formData));
        form.reset();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The policy delta file could not be imported.");
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm w-max m-auto">
      <form onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-6">
        {error ? <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}
        {result ? <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>Import complete: {result.policiesCreated} policies created, {result.statusesUpdated} policy statuses updated, {result.unchangedPolicies} existing policies unchanged, and {result.coveredEmployeesReplaced} covered employees imported.</span></div> : null}

        <label className="block max-w-2xl">
          <span className="mb-2 block text-xs font-semibold text-slate-600">Compagnie d’Assurance<span className="ml-1 text-teal-700">*</span></span>
          <select name="insuranceCompanyId" required defaultValue="" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
            <option value="" disabled>Sélectionnez la Compagnie d’Assurance</option>
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
          </select>
          <span className="mt-2 block text-xs text-slate-500">Propriétaire des polices chargées.</span>
        </label>

        <label className="block max-w-2xl">
          <span className="mb-2 block text-xs font-semibold text-slate-600">Fichier des Polices<span className="ml-1 text-teal-700">*</span></span>
          <input name="policyFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="block w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
          <span className="mt-2 block text-xs text-slate-500">Format des Colonnes: police, client, activité, adresse, ville, type, garantie, statut, date.</span>
        </label>
        <label className="block max-w-2xl">
          <span className="mb-2 block text-xs font-semibold text-slate-600">Fichier des Employés</span>
          <input name="employeeFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="block w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
          <span className="mt-2 block text-xs text-slate-500">Format des Colonnes: police, employé.</span>
        </label>

        <button type="submit" disabled={pending} className="relative left-[calc(100%-158px)] mt-2 inline-flex justify-end items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
          <Upload className="h-3.5 w-3.5" />
          {pending ? "Importation des Fichiers..." : "Importer les Fichiers"}
        </button>

      </form>
    </section>
  );
}
