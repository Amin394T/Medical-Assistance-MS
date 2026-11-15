"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { updateMedicalRecord } from "@/db/actions/medicalRecords";
import type { getMedicalRecord } from "@/db/actions/medicalRecords";
import type { SetMedicalRecord } from "@/db/schemas";
import { formatDateTime } from "@/app/_lib/date-format";

type MedicalRecordDetails = NonNullable<Awaited<ReturnType<typeof getMedicalRecord>>>;

type MedicalRecordEditFormProps = {
  record: MedicalRecordDetails;
  jobs: string[];
};

export function MedicalRecordEditForm({ record, jobs }: MedicalRecordEditFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  return (
    <form className="mb-6 space-y-6" onSubmit={async (event) => {
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
          accidentType: String(data.get("accidentType")) as SetMedicalRecord["accidentType"],
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
          accidentEvolution: String(data.get("accidentEvolution")) as SetMedicalRecord["accidentEvolution"],
          delegationDate: parseDate("delegationDate"),
          regulatoryDoctor: String(data.get("regulatoryDoctor") ?? "") || null,
          status: String(data.get("status")) as SetMedicalRecord["status"],
          statusReason: (String(data.get("statusReason") ?? "") || null) as SetMedicalRecord["statusReason"],
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
        <div className="grid gap-5 md:grid-cols-3">
          <ReadOnly label="Insurance Policy" value={record.policyNumber} />
          <ReadOnly label="Client Company" value={record.clientCompany} />
          <ReadOnly label="Insurance Provider" value={record.insuranceCompany} />
          <DateTimeField name="reportingDate" label="Reporting Date" value={record.reportingDate} required />
          <TextField name="reporterName" label="Reporter Name" defaultValue={record.reporterName ?? ""} />
          <TextField name="reporterPhone" label="Reporter Phone" defaultValue={record.reporterPhone} required type="tel" />
        </div>
      </Section>

      <Section title="02 / Accident Data">
        <div className="grid gap-5 md:grid-cols-3">
          <DateTimeField name="accidentDate" label="Accident Date" value={record.accidentDate} required />
          <SelectField name="accidentType" label="Accident Type" defaultValue={record.accidentType} required options={[
            ["AT", "Workplace accident"], ["MD", "Illness & pain"], ["VF", "Policy verification"], ["SS", "Special service"], ["PR", "Occupational disease"],
          ]} />
          <SelectField name="accidentCause" label="Accident Cause" defaultValue={record.accidentCause ?? ""} options={[
            ["", "Not specified"], ["FALL", "Falling or slipping"], ["EQIP", "Machine or equipment"], ["FATG", "Overexertion and fatigue"], ["HAZD", "Hazardous substance"], ["VIOL", "Workplace violence"], ["OBJC", "Moving objects"],
          ]} />
          <SelectField name="accidentPlace" label="Accident Place" defaultValue={record.accidentPlace} required options={[
            ["WS", "Workshop"], ["RT", "Route"], ["OF", "Office"], ["CT", "Construction"],
          ]} />
          <SelectField name="accidentEvolution" label="Evolution" defaultValue={record.accidentEvolution} required options={[
            ["INIT", "Initial"], ["RELP", "Relapse"], ["DEAT", "Death"], ["COMP", "Complement"],
          ]} />
        </div>
      </Section>

      <Section title="03 / Victim Data">
        <div className="grid gap-5 md:grid-cols-3">
          <TextField name="victimFirstName" label="Victim First Name" defaultValue={record.victimFirstName} required />
          <TextField name="victimLastName" label="Victim Last Name" defaultValue={record.victimLastName ?? ""} />
          <TextField name="victimNationalId" label="Victim National ID" defaultValue={record.victimNationalId} required />
          <TextField name="victimPhone" label="Victim Phone" defaultValue={record.victimPhone ?? ""} type="tel" />
          <TextField name="victimJob" label="Victim Job" defaultValue={record.victimJob ?? ""} options={jobs} />
        </div>
      </Section>

      <Section title="04 / Status Data">
        <div className="grid gap-5 md:grid-cols-3">
          <SelectField name="status" label="Record Status" defaultValue={record.status} required options={[
            ["PRG", "In progress"], ["DSP", "Disputed"], ["RJC", "Rejected"], ["CLS", "Closed"], ["ABN", "Abandoned"],
          ]} />
          <SelectField name="statusReason" label="Status Reason" defaultValue={record.statusReason ?? ""} options={[
            ["", "None"], ["SUS", "Policy suspended"], ["TER", "Policy terminated"], ["COV", "Coverage limited"],
          ]} />
          <DateTimeField name="delegationDate" label="Delegation Date" value={record.delegationDate} />
          <TextField name="regulatoryDoctor" label="Regulatory Doctor" defaultValue={record.regulatoryDoctor ?? ""} />
          <ReadOnly label="Manager" value={record.manager} />
          <TextField name="observation" label="Observation" defaultValue={record.observation ?? ""} />
          <ReadOnly label="Last Updated" value={formatDateTime(record.lastUpdated)} />
          <ReadOnly label="Last Updater" value={record.lastUpdater} />
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

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return <div role="status" className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><Icon className="h-5 w-5" /><span>{children}</span></div>;
}

function toLocalDateTime(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
