"use client";

/* TanStack Form's field API uses render functions through its children prop. */
/* eslint-disable react/no-children-prop */

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardPlus } from "lucide-react";
import Link from "next/link";

import { createMedicalRecordFromCall } from "@/db/actions/medicalRecords";

type ClientOption = { id: number; label: string };
type PolicyOption = {
  id: number;
  clientCompanyId: number;
  policyNumber: string;
  insuranceCompanyId: number;
  terminated: boolean;
  effectiveDate: string | null;
};
type ProviderOption = { id: number; label: string; type: "company" | "agent" | "broker" };
type PreviousRecord = { id: number; referenceNumber: string; clientCompanyId: number; victimName: string };

type MedicalRecordCallFormProps = {
  clients: ClientOption[];
  policies: PolicyOption[];
  providers: ProviderOption[];
  previousRecords: PreviousRecord[];
  displayReference: string;
  displayReportingDate: string;
};

type CallFormValues = {
  accidentDate: string;
  clientCompanyId: string;
  recordType: "normal" | "verification";
  reporterFirstName: string;
  reporterLastName: string;
  reporterPhone: string;
  accidentType: "initial" | "relapse" | "sickness" | "";
  initialAccidentId: string;
  accidentPlace: "workshop" | "route" | "office" | "site";
  victimFirstName: string;
  victimLastName: string;
  victimNationalId: string;
  victimPhone: string;
  accidentCause:
    | "falling or slipping"
    | "machine or equipment"
    | "overexertion and fatigue"
    | "hazardous substance"
    | "workplace violence"
    | "moving objects"
    | "";
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
  accidentDate: new Date().toISOString().slice(0, 10),
  clientCompanyId: "",
  recordType: "normal",
  reporterFirstName: "",
  reporterLastName: "",
  reporterPhone: "",
  accidentType: "initial",
  initialAccidentId: "",
  accidentPlace: "workshop",
  victimFirstName: "",
  victimLastName: "",
  victimNationalId: "",
  victimPhone: "",
  accidentCause: "",
};

export function MedicalRecordCallForm({ clients, policies, providers, previousRecords, displayReference, displayReportingDate }: MedicalRecordCallFormProps) {
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
          clientCompanyId: Number(value.clientCompanyId),
          initialAccidentId: value.initialAccidentId ? Number(value.initialAccidentId) : null,
        });
        setCreatedReference(record.referenceNumber);
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
              <Field form={form as unknown as FormRenderer} name="accidentDate" label="Accident date" required type="date" />
              <ReadOnlyField label="Reference number" value={displayReference} />
              <form.Field name="clientCompanyId" children={(field) => <SelectField field={field as unknown as RenderableField} label="Client company" required options={clients.map((client) => ({ value: String(client.id), label: client.label }))} placeholder="Select a client company" />} />
              <ReadOnlyField label="Insurance policy" value={getCoverage(form.state.values.clientCompanyId, policies)?.policyNumber ?? "Select a client company"} />
              <ReadOnlyField label="Insurance company" value={getProviderLabel(form.state.values.clientCompanyId, policies, providers)} />
              <form.Field name="recordType" children={(field) => <SelectField field={field as unknown as RenderableField} label="Record type" options={[{ value: "normal", label: "Normal" }, { value: "verification", label: "Verification" }]} />} />
            </div>
          </FormSection>

          <FormSection eyebrow="02 / Report data" title="Report data">
            <div className="grid gap-5 md:grid-cols-3">
              <ReadOnlyField label="Reporting date" value={formatDateTime(displayReportingDate)} />
              <Field form={form as unknown as FormRenderer} name="reporterFirstName" label="First name" required />
              <Field form={form as unknown as FormRenderer} name="reporterLastName" label="Last name" />
              <Field form={form as unknown as FormRenderer} name="reporterPhone" label="Phone" required type="tel" />
              <form.Field name="accidentType" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident type" options={[{ value: "initial", label: "Initial accident" }, { value: "relapse", label: "Relapse" }, { value: "sickness", label: "Sickness" }]} />} />
              {form.state.values.accidentType === "relapse" ? <form.Field name="initialAccidentId" children={(field) => <SelectField field={field as unknown as RenderableField} label="Initial accident" required options={previousRecords.filter((record) => record.clientCompanyId === Number(form.state.values.clientCompanyId)).map((record) => ({ value: String(record.id), label: `${record.referenceNumber} · ${record.victimName}` }))} placeholder="Select the initial record" />} /> : null}
              <form.Field name="accidentPlace" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident place" required options={[{ value: "workshop", label: "Workshop" }, { value: "route", label: "Route" }, { value: "office", label: "Office" }, { value: "site", label: "Site" }]} />} />
            </div>
          </FormSection>

          <FormSection eyebrow="03 / Victim data" title="Victim data">
            <div className="grid gap-5 md:grid-cols-2">
              <Field form={form as unknown as FormRenderer} name="victimFirstName" label="First name" required />
              <Field form={form as unknown as FormRenderer} name="victimLastName" label="Last name" required />
              <Field form={form as unknown as FormRenderer} name="victimNationalId" label="National ID" required />
              <Field form={form as unknown as FormRenderer} name="victimPhone" label="Phone" type="tel" />
              <form.Field name="accidentCause" children={(field) => <SelectField field={field as unknown as RenderableField} label="Accident cause" options={[{ value: "falling or slipping", label: "Falling or slipping" }, { value: "machine or equipment", label: "Machine or equipment" }, { value: "overexertion and fatigue", label: "Overexertion and fatigue" }, { value: "hazardous substance", label: "Hazardous substance" }, { value: "workplace violence", label: "Workplace violence" }, { value: "moving objects", label: "Moving objects" }]} placeholder="Select a cause" />} />
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

function getCoverage(clientCompanyId: string, policies: PolicyOption[]) {
  return policies.filter((item) => item.clientCompanyId === Number(clientCompanyId) && !item.terminated).sort((a, b) => (b.effectiveDate ?? "").localeCompare(a.effectiveDate ?? ""))[0];
}

function getProviderLabel(clientCompanyId: string, policies: PolicyOption[], providers: ProviderOption[]) {
  const policy = getCoverage(clientCompanyId, policies);
  return providers.find((item) => item.id === policy?.insuranceCompanyId)?.label ?? "Select a client company";
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