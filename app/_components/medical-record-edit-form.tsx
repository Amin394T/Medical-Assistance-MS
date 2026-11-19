"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { updateMedicalRecord } from "@/db/actions/medicalRecords";
import type { getMedicalRecord } from "@/db/actions/medicalRecords";
import type { SetMedicalRecord } from "@/db/schemas";
import { formatDateTime } from "@/app/_lib/date-format";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";

type MedicalRecordDetails = NonNullable<Awaited<ReturnType<typeof getMedicalRecord>>>;

type MedicalRecordEditFormProps = {
  record: MedicalRecordDetails;
  jobs: string[];
  created: boolean;
};

export function MedicalRecordEditForm({ record, jobs, created }: MedicalRecordEditFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  return (
    <form className="mb-6 space-y-6" onSubmit={async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const scrollContainer = form.closest("main");
      setPending(true);
      setNotice(null);
      const data = new FormData(form);
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
          statusReason: record.statusReason,
          observation: String(data.get("observation") ?? "") || null,
        };
        const updated = await updateMedicalRecord(record.id, values);
        if (!updated) throw new Error("Medical record not found.");
        setNotice({ tone: "success", text: "Changes saved." });
        router.refresh();
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (error) {
        setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to save changes." });
      } finally {
        setPending(false);
      }
    }}>
      {created ? <div role="status" className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><span>Record {formatMedicalRecordReference(record.accidentType, record.reference)} was created successfully.</span></div> : null}
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <Section title="01 / Informations sur le Client">
        <div className="grid gap-5 md:grid-cols-3">
          <ReadOnly label="Police d’Assurance" value={record.policyNumber} />
          <ReadOnly label="Entreprise Cliente" value={record.clientCompany} />
          <ReadOnly label="Compagnie d’Assurance" value={record.insuranceCompany} />
          <DateTimeField name="reportingDate" label="Date de Déclaration" value={record.reportingDate} required />
          <TextField name="reporterName" label="Nom du Déclarant" defaultValue={record.reporterName ?? ""} />
          <TextField name="reporterPhone" label="Téléphone du Déclarant" defaultValue={record.reporterPhone} required type="tel" />
        </div>
      </Section>

      <Section title="02 / Informations sur l’Accident">
        <div className="grid gap-5 md:grid-cols-3">
          <DateTimeField name="accidentDate" label="Date de l’Accident" value={record.accidentDate} required />
          <SelectField name="accidentType" label="Type d’Accident" defaultValue={record.accidentType} required options={[
            ["AT", "Accident du Travail"], ["MD", "Maladie et Douleur"], ["VF", "Vérification de la Police"], ["SS", "Prestation Spéciale"], ["PR", "Maladie Professionnelle"],
          ]} />
          <SelectField name="accidentCause" label="Cause de l’Accident" defaultValue={record.accidentCause ?? ""} options={[
            ["", "Non Précisée"], ["FALL", "Chute ou Glissade"], ["EQIP", "Machine ou Équipement"], ["FATG", "Surmenage et Fatigue"], ["HAZD", "Substance Dangereuse"], ["VIOL", "Violence au Travail"], ["OBJC", "Objets en Mouvement"],
          ]} />
          <SelectField name="accidentPlace" label="Lieu de l’Accident" defaultValue={record.accidentPlace} required options={[
            ["WS", "Atelier"], ["RT", "Route"], ["OF", "Bureau"], ["CT", "Chantier"],
          ]} />
          <SelectField name="accidentEvolution" label="Évolution du Cas" defaultValue={record.accidentEvolution} required options={[
            ["INIT", "Initiale"], ["RELP", "Rechute"], ["DEAT", "Décès"], ["COMP", "Complément"],
          ]} />
        </div>
      </Section>

      <Section title="03 / Informations sur la Victime">
        <div className="grid gap-5 md:grid-cols-3">
          <TextField name="victimFirstName" label="Prénom de la Victime" defaultValue={record.victimFirstName} required />
          <TextField name="victimLastName" label="Nom de la Victime" defaultValue={record.victimLastName ?? ""} />
          <TextField name="victimNationalId" label="Numéro d’Identité de la Victime" defaultValue={record.victimNationalId} required />
          <TextField name="victimPhone" label="Téléphone de la Victime" defaultValue={record.victimPhone ?? ""} type="tel" />
          <TextField name="victimJob" label="Profession de la Victime" defaultValue={record.victimJob ?? ""} options={jobs} />
        </div>
      </Section>

      <Section title="04 / Statut">
        <div className="grid gap-5 md:grid-cols-3">
          <SelectField name="status" label="Statut du Dossier" defaultValue={record.status} required options={[
            ["PRG", "En Cours"], ["DSP", "Contesté"], ["RJC", "Rejeté"], ["CLS", "Clôturé"], ["ABN", "Abandonné"],
          ]} />
          <ReadOnly label="Motif du Statut" value={getStatusReasonLabel(record.statusReason)} />
          <DateTimeField name="delegationDate" label="Date de Délégation" value={record.delegationDate} />
          <TextField name="regulatoryDoctor" label="Médecin-Conseil" defaultValue={record.regulatoryDoctor ?? ""} />
          <ReadOnly label="Gestionnaire" value={record.manager} />
          <TextField name="observation" label="Observation" defaultValue={record.observation ?? ""} />
        </div>
      </Section>

      <div className="mb-12 flex items-end justify-between border-t border-slate-200 pt-6">
        <div className="space-y-1 text-xs text-slate-500">
          <p>Dernière Modification : {formatDateTime(record.lastUpdated)}</p>
          <p>Dernier Modificateur : {record.lastUpdater}</p>
        </div>
        <button type="submit" disabled={pending} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          {pending ? "Enregistrement..." : "Enregistrer les Modifications"}
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
  const success = tone === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;
  return <div role={success ? "status" : "alert"} className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><Icon className="h-5 w-5" /><span>{children}</span></div>;
}

function getStatusReasonLabel(reason: MedicalRecordDetails["statusReason"]) {
  switch (reason) {
    case "SUS": return "Policy suspended";
    case "TER": return "Policy terminated";
    case "COV": return "Coverage limited";
    default: return "-";
  }
}

function toLocalDateTime(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100";
