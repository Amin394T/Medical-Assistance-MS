"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { updateMedicalRecord } from "@/db/actions/medicalRecords";
import type { getMedicalRecord } from "@/db/actions/medicalRecords";
import type { SetMedicalRecord } from "@/db/schemas";

type MedicalRecordDetails = NonNullable<Awaited<ReturnType<typeof getMedicalRecord>>>;
type PolicyOption = { id: number; policyNumber: string; clientCompany: string; insuranceCompany: string; intermediary: string | null };

type MedicalRecordEditFormProps = {
  record: MedicalRecordDetails;
  policies: PolicyOption[];
  jobs: string[];
};

export function MedicalRecordEditForm({ record, policies, jobs }: MedicalRecordEditFormProps) {
  const router = useRouter();
  const [policyId, setPolicyId] = useState(String(record.policyId));
  const [policyQuery, setPolicyQuery] = useState(policies.find((policy) => policy.id === record.policyId)?.policyNumber ?? "");
  const [isPolicyListOpen, setIsPolicyListOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const selectedPolicy = policies.find((policy) => String(policy.id) === policyId);

  return (
    <form className="mb-6 space-y-6" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      setNotice(null);
      const data = new FormData(event.currentTarget);
      try {
        if (!policyId) throw new Error("Select an insurance policy.");
        const parseDate = (name: string) => {
          const value = String(data.get(name) ?? "");
          return value ? new Date(value) : null;
        };
        const values: SetMedicalRecord = {
          type: String(data.get("type")) as SetMedicalRecord["type"],
          policyId: Number(data.get("policyId")),
          reportingDate: parseDate("reportingDate") ?? new Date(),
          reporterName: String(data.get("reporterName") ?? "") || null,
          reporterPhone: String(data.get("reporterPhone") ?? ""),
          accidentPlace: String(data.get("accidentPlace")) as SetMedicalRecord["accidentPlace"],
          accidentDate: parseDate("accidentDate") ?? new Date(),
          accidentCause: (String(data.get("accidentCause") ?? "") || null) as SetMedicalRecord["accidentCause"],
          victimFirstName: String(data.get("victimFirstName") ?? ""),
          victimLastName: String(data.get("victimLastName") ?? "") || null,
          victimPhone: String(data.get("victimPhone") ?? "") || null,
          victimNationalId: String(data.get("victimNationalId") ?? ""),
          victimJob: String(data.get("victimJob") ?? "") || null,
          evolution: String(data.get("evolution")) as SetMedicalRecord["evolution"],
          delegationDate: parseDate("delegationDate"),
          regulatoryDoctor: String(data.get("regulatoryDoctor") ?? "") || null,
          status: String(data.get("status")) as SetMedicalRecord["status"],
          observation: String(data.get("observation") ?? "") || null,
        };
        const updated = await updateMedicalRecord(record.id, values);
        if (!updated) throw new Error("Medical record not found.");
        setNotice({ tone: "success", text: "Changes saved." });
        router.refresh();
      } catch (error) {
        setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to save changes." });
      } finally {
        setPending(false);
      }
    }}>
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <Section title="01 / Client Data">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="relative block"><span className="mb-2 block text-sm font-semibold text-slate-700">Insurance Policy<span className="ml-1 text-teal-700">*</span></span><input value={policyQuery} onFocus={() => setIsPolicyListOpen(true)} onClick={() => setIsPolicyListOpen(true)} onChange={(event) => { setPolicyQuery(event.target.value); setPolicyId(""); setIsPolicyListOpen(true); }} className={inputClass} placeholder="Search policy number or client" role="combobox" aria-expanded={isPolicyListOpen} aria-controls="edit-policy-picker-options" aria-autocomplete="list" /><input type="hidden" name="policyId" value={policyId} />{isPolicyListOpen ? <div id="edit-policy-picker-options" role="listbox" className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-slate-200 bg-white shadow-lg">{policies.filter((policy) => `${policy.policyNumber} ${policy.clientCompany}`.toLowerCase().includes(policyQuery.trim().toLowerCase())).slice(0, 8).map((policy) => <button key={policy.id} type="button" role="option" aria-selected={String(policy.id) === policyId} onMouseDown={(event) => event.preventDefault()} onClick={() => { setPolicyId(String(policy.id)); setPolicyQuery(policy.policyNumber); setIsPolicyListOpen(false); }} className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-teal-50"><span className="block font-semibold text-slate-900">{policy.policyNumber}</span><span className="block text-xs text-slate-500">{policy.clientCompany}</span></button>)}</div> : null}</label>
          <ReadOnly label="Client Company" value={selectedPolicy?.clientCompany ?? null} />
          <ReadOnly label="Insurance Provider" value={formatInsuranceProvider(selectedPolicy?.insuranceCompany, selectedPolicy?.intermediary)} />
        </div>
      </Section>

      <Section title="02 / Reporter Data">
        <div className="grid gap-5 md:grid-cols-2">
          <DateTimeField name="reportingDate" label="Reporting Date" value={record.reportingDate} required />
          <TextField name="reporterName" label="Reporter Name" defaultValue={record.reporterName ?? ""} />
          <TextField name="reporterPhone" label="Reporter Phone" defaultValue={record.reporterPhone} required type="tel" />
        </div>
      </Section>

      <Section title="03 / Accident Data">
        <div className="grid gap-5 md:grid-cols-2">
          <DateTimeField name="accidentDate" label="Accident Date" value={record.accidentDate} required />
          <SelectField name="type" label="Accident Type" defaultValue={record.type} required options={[
            ["AT", "Workplace accident"], ["MD", "Illness & pain"], ["VF", "Policy verification"], ["SS", "Special service"], ["PR", "Occupational disease"], ["AV", "Lawyer procedure"],
          ]} />
          <SelectField name="accidentCause" label="Accident Cause" defaultValue={record.accidentCause ?? ""} options={[
            ["", "Not specified"], ["FALL", "Falling or slipping"], ["EQIP", "Machine or equipment"], ["FATG", "Overexertion and fatigue"], ["HAZD", "Hazardous substance"], ["VIOL", "Workplace violence"], ["OBJC", "Moving objects"],
          ]} />
          <SelectField name="accidentPlace" label="Accident Place" defaultValue={record.accidentPlace} required options={[
            ["WS", "Workshop"], ["RT", "Route"], ["OF", "Office"], ["CS", "Construction"],
          ]} />
        </div>
      </Section>

      <Section title="04 / Victim Data">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="victimFirstName" label="Victim First Name" defaultValue={record.victimFirstName} required />
          <TextField name="victimLastName" label="Victim Last Name" defaultValue={record.victimLastName ?? ""} />
          <TextField name="victimPhone" label="Victim Phone" defaultValue={record.victimPhone ?? ""} type="tel" />
          <TextField name="victimNationalId" label="Victim National ID" defaultValue={record.victimNationalId} required />
          <TextField name="victimJob" label="Victim Job" defaultValue={record.victimJob ?? ""} options={jobs} />
        </div>
      </Section>

      <Section title="05 / Status Data">
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField name="status" label="Record Status" defaultValue={record.status} required options={[
            ["PROG", "In progress"], ["CLOS", "Closed"], ["ABAN", "Abandoned"],
          ]} />
          <SelectField name="evolution" label="Evolution" defaultValue={record.evolution} required options={[
            ["INIT", "Initial"], ["RELP", "Relapse"], ["DEAT", "Death"], ["COMP", "Complement"],
          ]} />
          <ReadOnly label="Record Fate" value={record.fate ? "Valid" : "Rejected"} />
          <DateTimeField name="delegationDate" label="Delegation Date" value={record.delegationDate} />
          <TextField name="regulatoryDoctor" label="Regulatory Doctor" defaultValue={record.regulatoryDoctor ?? ""} />
        </div>
      </Section>

      <Section title="06 / Audit Data">
        <div className="grid gap-5 md:grid-cols-2">
          <ReadOnly label="Managed By" value={record.managedBy} />
          <TextField name="observation" label="Observation" defaultValue={record.observation ?? ""} />
          <ReadOnly label="Opening Date" value={formatDateTime(record.openingDate)} />
          <ReadOnly label="Last Modified" value={formatDateTime(record.lastModified)} />
        </div>
      </Section>

      <div className="flex justify-end border-t border-slate-200 pt-6 mb-12">
        <button type="submit" disabled={pending} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-teal-800">{title}</h2></div>{children}</section>;
}

function TextField({ name, label, defaultValue, required, type = "text", options }: { name: string; label: string; defaultValue: string; required?: boolean; type?: string; options?: string[] }) {
  const listId = options?.length ? `${name}-options` : undefined;
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{required ? <span className="ml-1 text-teal-700">*</span> : null}</span><input name={name} type={type} list={listId} defaultValue={defaultValue} required={required} className={inputClass} />{listId ? <datalist id={listId}>{options?.map((option) => <option key={option} value={option} />)}</datalist> : null}</label>;
}

function SelectField({ name, label, defaultValue, options, required }: { name: string; label: string; defaultValue: string; options: [string, string][]; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{required ? <span className="ml-1 text-teal-700">*</span> : null}</span><select name={name} defaultValue={defaultValue} required={required} className={inputClass}>{options.map(([value, text]) => <option key={value || "empty"} value={value}>{text}</option>)}</select></label>;
}

function DateTimeField({ name, label, value, required }: { name: string; label: string; value: Date | null; required?: boolean }) {
  return <TextField name={name} label={label} type="datetime-local" defaultValue={value ? toLocalDateTime(value) : ""} required={required} />;
}

function ReadOnly({ label, value }: { label: string; value: string | number | null }) {
  return <div><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600">{value ?? "-"}</div></div>;
}

function formatInsuranceProvider(insuranceCompany: string | undefined, intermediary: string | null | undefined) {
  if (!insuranceCompany) return null;
  return intermediary ? `${insuranceCompany} (${intermediary})` : insuranceCompany;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "medium" }).format(value);
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return <div role="status" className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><Icon className="h-5 w-5" /><span>{children}</span></div>;
}

function toLocalDateTime(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
