"use client";

/* TanStack Form's field API uses render functions through its children prop. */
/* eslint-disable react/no-children-prop */

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { createMedicalRecord } from "@/db/actions/medicalRecords";

type PolicyOption = {
  id: number;
  policyNumber: string;
  clientCompanyLabel: string;
  insuranceCompanyLabel: string;
  intermediaryLabel: string | null;
};
type MedicalRecordCallFormProps = {
  policies: PolicyOption[];
  jobs: string[];
  displayReportingDate: string;
};

type CallFormValues = {
  accidentDate: string;
  policyId: string;
  type: "AT" | "MD" | "VF" | "SS" | "PR" | "AV";
  reporterName: string;
  reporterPhone: string;
  accidentPlace: "WS" | "RT" | "OF" | "CS";
  victimFirstName: string;
  victimLastName: string;
  victimNationalId: string;
  victimPhone: string;
  victimJob: string;
  accidentCause: "FALL" | "EQIP" | "FATG" | "HAZD" | "VIOL" | "OBJC" | "";
};

type RenderableField = {
  state: { value: unknown; meta: { errors: unknown[] } };
  handleBlur: () => void;
  handleChange: (value: unknown) => void;
};

type FormRenderer = {
  Field: React.ComponentType<{
    name: keyof CallFormValues;
    validators?: { onBlur?: (args: { value: unknown }) => string | undefined };
    children: (field: RenderableField) => React.ReactNode;
  }>;
};

const initialValues: CallFormValues = {
  accidentDate: new Date().toISOString().slice(0, 16),
  policyId: "",
  type: "AT",
  reporterName: "",
  reporterPhone: "",
  accidentPlace: "WS",
  victimFirstName: "",
  victimLastName: "",
  victimNationalId: "",
  victimPhone: "",
  victimJob: "",
  accidentCause: "",
};

export function MedicalRecordCallForm({ policies, jobs, displayReportingDate }: MedicalRecordCallFormProps) {
  const [submitError, setSubmitError] = useState("");
  const [createdReference, setCreatedReference] = useState("");
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setSubmitError("");
      setCreatedReference("");

      try {
        const record = await createMedicalRecord({
          type: value.type,
          policyId: Number(value.policyId),
          reportingDate: new Date(displayReportingDate),
          reporterName: value.reporterName || null,
          reporterPhone: value.reporterPhone,
          accidentPlace: value.accidentPlace,
          accidentDate: new Date(value.accidentDate),
          accidentCause: value.accidentCause || null,
          victimFirstName: value.victimFirstName,
          victimLastName: value.victimLastName || null,
          victimNationalId: value.victimNationalId,
          victimPhone: value.victimPhone || null,
          victimJob: value.victimJob || null,
          managedBy: "" //TODO: replace with current user
        });
        setCreatedReference(formatReference(record.reference));
        form.reset();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to create the medical record.");
      }
    },
  });

  return (
    <>
        {createdReference ? <Notice icon={<CheckCircle2 className="h-5 w-5" />} tone="success">Record {createdReference} was created successfully.</Notice> : null}
        {submitError ? <Notice icon={<AlertCircle className="h-5 w-5" />} tone="error">{submitError}</Notice> : null}

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FormSection title="01 / Client Data">
            <div className="grid gap-5 md:grid-cols-3">
              <form.Field key={createdReference} name="policyId" children={(field) => <PolicyPicker field={field as unknown as RenderableField} policies={policies} />} />
              <form.Subscribe selector={(state) => state.values.policyId} children={(policyId) => {
                const selectedPolicy = getSelectedPolicy(policyId, policies);
                return <>
                  <ReadOnlyField label="Client Company" value={selectedPolicy?.clientCompanyLabel ?? "Select an insurance policy"} />
                  <ReadOnlyField label="Insurance Provider" value={formatInsuranceProvider(selectedPolicy?.insuranceCompanyLabel, selectedPolicy?.intermediaryLabel)} />
                </>;
              }} />
              <ReadOnlyField label="Reporting Date" value={formatDateTime(displayReportingDate)} />
              <Field form={form as unknown as FormRenderer} name="reporterName" label="Reporter Name" />
              <Field form={form as unknown as FormRenderer} name="reporterPhone" label="Reporter Phone" required type="tel" />
            </div>
          </FormSection>

          <FormSection title="02 / Accident Data">
            <div className="grid gap-5 md:grid-cols-3">
              <Field form={form as unknown as FormRenderer} name="accidentDate" label="Accident Date" required type="datetime-local" />
              <form.Field name="type" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident Type" required options={[{ value: "AT", label: "Workplace accident" }, { value: "MD", label: "Illness & pain" }, { value: "VF", label: "Policy verification" }, { value: "SS", label: "Special service" }, { value: "PR", label: "Occupational disease" }, { value: "AV", label: "Lawyer procedure" }]} />} />
              <form.Field name="accidentCause" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident Cause" options={[{ value: "FALL", label: "Falling or slipping" }, { value: "EQIP", label: "Machine or equipment" }, { value: "FATG", label: "Overexertion and fatigue" }, { value: "HAZD", label: "Hazardous substance" }, { value: "VIOL", label: "Workplace violence" }, { value: "OBJC", label: "Moving objects" }]} placeholder="Select a cause" />} />
              <form.Field name="accidentPlace" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident Place" required options={[{ value: "WS", label: "Workshop" }, { value: "RT", label: "Route" }, { value: "OF", label: "Office" }, { value: "CS", label: "Construction" }]} />} />
            </div>
          </FormSection>

          <FormSection title="03 / Victim Data">
            <div className="grid gap-5 md:grid-cols-3">
              <Field form={form as unknown as FormRenderer} name="victimFirstName" label="Victim First Name" required />
              <Field form={form as unknown as FormRenderer} name="victimLastName" label="Victim Last Name" />
              <Field form={form as unknown as FormRenderer} name="victimNationalId" label="National ID" required />
              <Field form={form as unknown as FormRenderer} name="victimPhone" label="Phone" type="tel" />
              <Field form={form as unknown as FormRenderer} name="victimJob" label="Victim Job" options={jobs} />
            </div>
          </FormSection>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => <button type="submit" disabled={!canSubmit || isSubmitting} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">{isSubmitting ? "Creating Record..." : "Create Medical Record"}</button>} />
          </div>
        </form>
    </>
  );
}

function Field({ form, name, label, required, type = "text", options }: { form: FormRenderer; name: keyof CallFormValues; label: string; required?: boolean; type?: string; options?: string[] }) {
  const listId = options?.length ? `${name}-options` : undefined;
  return <form.Field name={name} validators={{ onBlur: ({ value }) => required && !String(value).trim() ? `${label} is required` : undefined }} children={(field) => <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{required ? <span className="ml-1 text-teal-700">*</span> : null}</span><input type={type} list={listId} value={String(field.state.value)} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{listId ? <datalist id={listId}>{options?.map((option) => <option key={option} value={option} />)}</datalist> : null}{field.state.meta.errors[0] ? <span className="mt-1 block text-xs text-rose-600">{String(field.state.meta.errors[0])}</span> : null}</label>} />;
}

function SelectField({ field, label, options, required, placeholder }: { field: RenderableField; label: string; options: { value: string; label: string }[]; required?: boolean; placeholder?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{required ? <span className="ml-1 text-teal-700">*</span> : null}</span><select value={String(field.state.value)} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} className={inputClass}><option value="">{placeholder ?? "Select an option"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{field.state.meta.errors[0] ? <span className="mt-1 block text-xs text-rose-600">{String(field.state.meta.errors[0])}</span> : null}</label>;
}

function PolicyPicker({ field, policies }: { field: RenderableField; policies: PolicyOption[] }) {
  const selectedPolicy = policies.find((policy) => String(policy.id) === String(field.state.value));
  const [query, setQuery] = useState(selectedPolicy?.policyNumber ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const matches = policies.filter((policy) => `${policy.policyNumber} ${policy.clientCompanyLabel}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8);

  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Insurance Policy<span className="ml-1 text-teal-700">*</span></span><input value={query} onBlur={field.handleBlur} onFocus={() => setIsOpen(true)} onClick={() => setIsOpen(true)} onChange={(event) => { setQuery(event.target.value); setIsOpen(true); field.handleChange(""); }} className={inputClass} placeholder="Search policy number or client" role="combobox" aria-expanded={isOpen && Boolean(query.trim())} aria-controls="policy-picker-options" aria-autocomplete="list" />{isOpen && query.trim() ? <div id="policy-picker-options" role="listbox" className="mt-1 max-h-56 overflow-y-auto border border-slate-200 bg-white shadow-lg">{matches.length ? matches.map((policy) => <button key={policy.id} type="button" role="option" aria-selected={String(policy.id) === String(field.state.value)} onMouseDown={(event) => event.preventDefault()} onClick={() => { field.handleChange(String(policy.id)); setQuery(policy.policyNumber); setIsOpen(false); }} className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-teal-50"><span className="block font-semibold text-slate-900">{policy.policyNumber}</span>  <span className="block text-xs text-slate-500">{policy.clientCompanyLabel}</span></button>) : <p className="px-3 py-2 text-sm text-slate-500">No matching policies.</p>}</div> : null}{field.state.meta.errors[0] ? <span className="mt-1 block text-xs text-rose-600">{String(field.state.meta.errors[0])}</span> : null}</label>;}

function getSelectedPolicy(policyId: string, policies: PolicyOption[]) {
  return policies.find((policy) => policy.id === Number(policyId));
}

function formatInsuranceProvider(insuranceCompany?: string, intermediary?: string | null) {
  if (!insuranceCompany) return "Select an insurance policy";
  return intermediary ? `${insuranceCompany} (${intermediary})` : insuranceCompany;
}

function formatReference(reference: number) {
  const value = String(reference);
  return `${value.slice(0, -2)}-${value.slice(-2)}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value)).replace(",", "");
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600">{value}</div></div>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-teal-800">{title}</h2></div>{children}</section>;
}

function Notice({ icon, tone, children }: { icon: React.ReactNode; tone: "success" | "error"; children: React.ReactNode }) {
  return <div className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{icon}<span>{children}</span></div>;
}

const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";