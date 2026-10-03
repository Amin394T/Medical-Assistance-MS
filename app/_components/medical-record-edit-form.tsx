"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateMedicalRecord } from "@/db/actions/medicalRecords";
import type { getMedicalRecord } from "@/db/actions/medicalRecords";
import type { SetMedicalRecord } from "@/db/schemas";

type MedicalRecordDetails = NonNullable<Awaited<ReturnType<typeof getMedicalRecord>>>;
type PolicyOption = { id: number; policyNumber: string; clientCompany: string; insuranceCompany: string; intermediary: string | null };

type MedicalRecordEditFormProps = {
  record: MedicalRecordDetails;
  policies: PolicyOption[];
};

export function MedicalRecordEditForm({ record, policies }: MedicalRecordEditFormProps) {
  const router = useRouter();
  const [policyId, setPolicyId] = useState(String(record.policyId));
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const selectedPolicy = policies.find((policy) => String(policy.id) === policyId);

  return (
    <form className="space-y-5" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      setNotice(null);
      const data = new FormData(event.currentTarget);
      try {
        const parseDate = (name: string) => {
          const value = String(data.get(name) ?? "");
          return value ? new Date(value) : null;
        };
        const values: SetMedicalRecord = {
          type: String(data.get("type")) as SetMedicalRecord["type"],
          policyId: Number(data.get("policyId")),
          reportingDate: parseDate("reportingDate") ?? new Date(),
          reporterFirstName: String(data.get("reporterFirstName") ?? ""),
          reporterLastName: String(data.get("reporterLastName") ?? "") || null,
          reporterPhone: String(data.get("reporterPhone") ?? ""),
          accidentPlace: String(data.get("accidentPlace")) as SetMedicalRecord["accidentPlace"],
          accidentDate: parseDate("accidentDate") ?? new Date(),
          accidentCause: (String(data.get("accidentCause") ?? "") || null) as SetMedicalRecord["accidentCause"],
          victimFirstName: String(data.get("victimFirstName") ?? ""),
          victimLastName: String(data.get("victimLastName") ?? ""),
          victimPhone: String(data.get("victimPhone") ?? "") || null,
          victimNationalId: String(data.get("victimNationalId") ?? ""),
          victimJob: String(data.get("victimJob") ?? "") || null,
          accidentEvolution: String(data.get("accidentEvolution")) as SetMedicalRecord["accidentEvolution"],
          delegationDate: parseDate("delegationDate"),
          coverageIssued: data.get("coverageIssued") === "" ? null : data.get("coverageIssued") === "true",
          coverageDate: parseDate("coverageDate"),
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

      <Section title="Record data">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnly label="Reference" value={record.reference} />
          <SelectField name="type" label="Record type" defaultValue={record.type} required options={[
            ["AT", "Workplace accident"], ["MD", "Illness & pain"], ["VF", "Policy verification"], ["SS", "Special service"], ["PR", "Occupational disease"],
          ]} />
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Insurance policy *</span><select name="policyId" value={policyId} onChange={(event) => setPolicyId(event.target.value)} required className={inputClass}>{policies.map((policy) => <option key={policy.id} value={String(policy.id)}>{policy.policyNumber} · {policy.clientCompany}</option>)}</select></label>
          <ReadOnly label="Client company" value={selectedPolicy?.clientCompany ?? null} />
          <ReadOnly label="Insurance company" value={selectedPolicy?.insuranceCompany ?? null} />
          <ReadOnly label="Intermediary" value={selectedPolicy?.intermediary ?? null} />
        </div>
      </Section>

      <Section title="Report data">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DateTimeField name="reportingDate" label="Reporting date" value={record.reportingDate} required />
          <TextField name="reporterFirstName" label="Reporter first name" defaultValue={record.reporterFirstName} required />
          <TextField name="reporterLastName" label="Reporter last name" defaultValue={record.reporterLastName ?? ""} />
          <TextField name="reporterPhone" label="Reporter phone" defaultValue={record.reporterPhone} required type="tel" />
          <SelectField name="accidentPlace" label="Accident place" defaultValue={record.accidentPlace} required options={[
            ["WS", "Workshop"], ["RT", "Route"], ["OF", "Office"], ["CS", "Construction"],
          ]} />
        </div>
      </Section>

      <Section title="Victim data">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DateTimeField name="accidentDate" label="Accident date" value={record.accidentDate} required />
          <SelectField name="accidentCause" label="Accident cause" defaultValue={record.accidentCause ?? ""} options={[
            ["", "Not specified"], ["FALL", "Falling or slipping"], ["EQIP", "Machine or equipment"], ["FATG", "Overexertion and fatigue"], ["HAZD", "Hazardous substance"], ["VIOL", "Workplace violence"], ["OBJC", "Moving objects"],
          ]} />
          <TextField name="victimFirstName" label="Victim first name" defaultValue={record.victimFirstName} required />
          <TextField name="victimLastName" label="Victim last name" defaultValue={record.victimLastName} required />
          <TextField name="victimPhone" label="Victim phone" defaultValue={record.victimPhone ?? ""} type="tel" />
          <TextField name="victimNationalId" label="Victim national ID" defaultValue={record.victimNationalId} required />
          <TextField name="victimJob" label="Victim job" defaultValue={record.victimJob ?? ""} />
        </div>
      </Section>

      <Section title="Evolution data">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField name="accidentEvolution" label="Accident evolution" defaultValue={record.accidentEvolution} required options={[
            ["INIT", "Initial"], ["DELG", "Delegation"], ["RELP", "Relapse"], ["DEAT", "Death"], ["COMP", "Complement"],
          ]} />
          <DateTimeField name="delegationDate" label="Delegation date" value={record.delegationDate} />
          <SelectField name="coverageIssued" label="Coverage issued" defaultValue={record.coverageIssued === null ? "" : String(record.coverageIssued)} options={[
            ["", "Not specified"], ["true", "Yes"], ["false", "No"],
          ]} />
          <DateField name="coverageDate" label="Coverage date" value={record.coverageDate} />
        </div>
      </Section>

      <Section title="Status data">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField name="status" label="Record status" defaultValue={record.status} required options={[
            ["PROG", "In progress"], ["SETT", "Settled"], ["CLOS", "Closed"], ["ABAN", "Abandoned"], ["BILL", "Billed"],
          ]} />
          <ReadOnly label="Record fate" value={record.fate} />
          <ReadOnly label="Fate reason" value={record.fateReason} />
          <ReadOnly label="Managed by" value={record.managedBy} />
          <TextField name="observation" label="Observation" defaultValue={record.observation ?? ""} />
        </div>
      </Section>

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <button type="submit" disabled={pending} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400">
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-y border-slate-200 bg-white px-5 py-5"><h2 className="mb-4 text-base font-bold text-slate-900">{title}</h2>{children}</section>;
}

function TextField({ name, label, defaultValue, required, type = "text" }: { name: string; label: string; defaultValue: string; required?: boolean; type?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required ? " *" : ""}</span><input name={name} type={type} defaultValue={defaultValue} required={required} className={inputClass} /></label>;
}

function SelectField({ name, label, defaultValue, options, required }: { name: string; label: string; defaultValue: string; options: [string, string][]; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required ? " *" : ""}</span><select name={name} defaultValue={defaultValue} required={required} className={inputClass}>{options.map(([value, text]) => <option key={value || "empty"} value={value}>{text}</option>)}</select></label>;
}

function DateTimeField({ name, label, value, required }: { name: string; label: string; value: Date | null; required?: boolean }) {
  return <TextField name={name} label={label} type="datetime-local" defaultValue={value ? toLocalDateTime(value) : ""} required={required} />;
}

function DateField({ name, label, value }: { name: string; label: string; value: Date | null }) {
  return <TextField name={name} label={label} type="date" defaultValue={value ? toLocalDate(value) : ""} />;
}

function ReadOnly({ label, value }: { label: string; value: string | number | null }) {
  return <div><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><div className="flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">{value ?? "-"}</div></div>;
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return <p role="status" className={`border-l-4 px-4 py-3 text-sm font-medium ${tone === "error" ? "border-rose-600 bg-rose-50 text-rose-800" : "border-emerald-600 bg-emerald-50 text-emerald-800"}`}>{children}</p>;
}

function toLocalDateTime(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toLocalDate(value: Date) {
  return toLocalDateTime(value).slice(0, 10);
}

const inputClass = "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
