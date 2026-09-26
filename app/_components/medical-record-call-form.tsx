"use client";

/* TanStack Form's field API uses render functions through its children prop. */
/* eslint-disable react/no-children-prop */

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardPlus } from "lucide-react";
import Link from "next/link";

import { createMedicalRecordFromCall } from "@/db/actions/medicalRecords";

type PolicyOption = {
  id: number;
  policyNumber: string;
  clientCompanyLabel: string;
  insuranceCompanyLabel: string;
  intermediaryLabel: string | null;
  terminated: boolean;
  effectiveDate: string;
  terminationDate: string | null;
};
type MedicalRecordCallFormProps = {
  policies: PolicyOption[];
  displayReportingDate: string;
};

type CallFormValues = {
  accidentDate: string;
  policyId: string;
  recordType: "AT" | "MD" | "VF" | "SS" | "PR";
  reporterFirstName: string;
  reporterLastName: string;
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
  recordType: "AT",
  reporterFirstName: "",
  reporterLastName: "",
  reporterPhone: "",
  accidentPlace: "WS",
  victimFirstName: "",
  victimLastName: "",
  victimNationalId: "",
  victimPhone: "",
  victimJob: "",
  accidentCause: "",
};

export function MedicalRecordCallForm({ policies, displayReportingDate }: MedicalRecordCallFormProps) {
  const [submitError, setSubmitError] = useState("");
  const [createdReference, setCreatedReference] = useState("");
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setSubmitError("");
      setCreatedReference("");

      try {
        const record = await createMedicalRecordFromCall({
          ...value,
          policyId: Number(value.policyId),
        });
        setCreatedReference(record.reference);
        form.reset();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to create the medical record.");
      }
    },
  });

  return (
    <section className="min-h-full bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Medical Records
            </Link>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Assistance</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Emergency Call</h1>
          </div>
          <div className="hidden rounded-xl bg-teal-50 p-3 text-teal-700 sm:block">
            <ClipboardPlus className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

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
          <FormSection eyebrow="01 / Record data" title="Record data">
            <div className="grid gap-5 md:grid-cols-2">
              <form.Field name="recordType" children={(field) => <SelectField field={field as unknown as RenderableField} label="Record type" required options={[{ value: "AT", label: "Workplace accident" }, { value: "MD", label: "Illness & pain" }, { value: "VF", label: "Policy verification" }, { value: "SS", label: "Special service" }, { value: "PR", label: "Occupational disease" }]} />} />
              <form.Field key={createdReference} name="policyId" children={(field) => <PolicyPicker field={field as unknown as RenderableField} policies={policies} />} />
              <ReadOnlyField label="Client company" value={getSelectedPolicy(form.state.values.policyId, policies)?.clientCompanyLabel ?? "Select an insurance policy"} />
              <ReadOnlyField label="Insurance company" value={getSelectedPolicy(form.state.values.policyId, policies)?.insuranceCompanyLabel ?? "Select an insurance policy"} />
              <ReadOnlyField label="Intermediary" value={getSelectedPolicy(form.state.values.policyId, policies)?.intermediaryLabel ?? "-"} />
            </div>
          </FormSection>

          <FormSection eyebrow="02 / Report data" title="Report data">
            <div className="grid gap-5 md:grid-cols-3">
              <ReadOnlyField label="Reporting date" value={formatDateTime(displayReportingDate)} />
              <Field form={form as unknown as FormRenderer} name="reporterFirstName" label="First name" required />
              <Field form={form as unknown as FormRenderer} name="reporterLastName" label="Last name" />
              <Field form={form as unknown as FormRenderer} name="reporterPhone" label="Phone" required type="tel" />
              <form.Field name="accidentPlace" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident place" required options={[{ value: "WS", label: "Workshop" }, { value: "RT", label: "Route" }, { value: "OF", label: "Office" }, { value: "CS", label: "Construction" }]} />} />
              <Field form={form as unknown as FormRenderer} name="accidentDate" label="Accident date" required type="datetime-local" />
            </div>
          </FormSection>

          <FormSection eyebrow="03 / Victim data" title="Victim data">
            <div className="grid gap-5 md:grid-cols-2">
              <Field form={form as unknown as FormRenderer} name="victimFirstName" label="First name" required />
              <Field form={form as unknown as FormRenderer} name="victimLastName" label="Last name" required />
              <Field form={form as unknown as FormRenderer} name="victimNationalId" label="National ID" required />
              <Field form={form as unknown as FormRenderer} name="victimPhone" label="Phone" type="tel" />
              <Field form={form as unknown as FormRenderer} name="victimJob" label="Job" />
              <form.Field name="accidentCause" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident cause" options={[{ value: "FALL", label: "Falling or slipping" }, { value: "EQIP", label: "Machine or equipment" }, { value: "FATG", label: "Overexertion and fatigue" }, { value: "HAZD", label: "Hazardous substance" }, { value: "VIOL", label: "Workplace violence" }, { value: "OBJC", label: "Moving objects" }]} placeholder="Select a cause" />} />
            </div>
          </FormSection>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => <button type="submit" disabled={!canSubmit || isSubmitting} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">{isSubmitting ? "Creating record..." : "Create medical record"}</button>} />
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({ form, name, label, required, type = "text" }: { form: FormRenderer; name: keyof CallFormValues; label: string; required?: boolean; type?: string }) {
  return <form.Field name={name} validators={{ onBlur: ({ value }) => required && !String(value).trim() ? `${label} is required` : undefined }} children={(field) => <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{required ? <span className="ml-1 text-teal-700">*</span> : null}</span><input type={type} value={String(field.state.value)} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} className={inputClass} />{field.state.meta.errors[0] ? <span className="mt-1 block text-xs text-rose-600">{String(field.state.meta.errors[0])}</span> : null}</label>} />;
}

function SelectField({ field, label, options, required, placeholder }: { field: RenderableField; label: string; options: { value: string; label: string }[]; required?: boolean; placeholder?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{required ? <span className="ml-1 text-teal-700">*</span> : null}</span><select value={String(field.state.value)} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} className={inputClass}><option value="">{placeholder ?? "Select an option"}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{field.state.meta.errors[0] ? <span className="mt-1 block text-xs text-rose-600">{String(field.state.meta.errors[0])}</span> : null}</label>;
}

function PolicyPicker({ field, policies }: { field: RenderableField; policies: PolicyOption[] }) {
  const selectedPolicy = policies.find((policy) => String(policy.id) === String(field.state.value));
  const [query, setQuery] = useState(selectedPolicy ? `${selectedPolicy.policyNumber} · ${selectedPolicy.clientCompanyLabel}` : "");
  const matches = policies.filter((policy) => `${policy.policyNumber} ${policy.clientCompanyLabel}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8);

  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Insurance policy / client<span className="ml-1 text-teal-700">*</span></span><input value={query} onBlur={field.handleBlur} onChange={(event) => { setQuery(event.target.value); field.handleChange(""); }} className={inputClass} placeholder="Search policy number or client" role="combobox" aria-expanded={Boolean(query.trim())} aria-controls="policy-picker-options" aria-autocomplete="list" />{query.trim() ? <div id="policy-picker-options" role="listbox" className="mt-1 max-h-56 overflow-y-auto border border-slate-200 bg-white shadow-lg">{matches.length ? matches.map((policy) => <button key={policy.id} type="button" role="option" aria-selected={String(policy.id) === String(field.state.value)} onMouseDown={(event) => event.preventDefault()} onClick={() => { field.handleChange(String(policy.id)); setQuery(`${policy.policyNumber} · ${policy.clientCompanyLabel}`); }} className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-teal-50"><span className="block font-semibold text-slate-900">{policy.policyNumber}</span><span className="block text-xs text-slate-500">{policy.clientCompanyLabel}{policy.terminated ? " · Terminated" : ""}</span></button>) : <p className="px-3 py-2 text-sm text-slate-500">No matching policies.</p>}</div> : null}{field.state.meta.errors[0] ? <span className="mt-1 block text-xs text-rose-600">{String(field.state.meta.errors[0])}</span> : null}</label>;
}

function getSelectedPolicy(policyId: string, policies: PolicyOption[]) {
  return policies.find((policy) => policy.id === Number(policyId));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value)).replace(",", "");
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600">{value}</div></div>;
}

function FormSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 border-b border-slate-100 pb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2></div>{children}</section>;
}

function Notice({ icon, tone, children }: { icon: React.ReactNode; tone: "success" | "error"; children: React.ReactNode }) {
  return <div className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{icon}<span>{children}</span></div>;
}

const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";