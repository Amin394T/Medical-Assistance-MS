import Link from "next/link";

import { getMedicalRecordDetails } from "@/db/actions/medicalRecords";
import { listMedicalDocumentsForRecord } from "@/db/actions/medicalDocuments";
import { listMedicalServicesForRecord } from "@/db/actions/medicalServices";

export const dynamic = "force-dynamic";

export default async function MedicalRecordDetailsPage({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const { id } = await searchParams;
	const recordId = Number(id);
	if (!Number.isInteger(recordId) || recordId < 1) return <Message message="Record not found." />;

	const [record, services, documents] = await Promise.all([
		getMedicalRecordDetails(recordId),
		listMedicalServicesForRecord(recordId),
		listMedicalDocumentsForRecord(recordId),
	]);
	if (!record) return <Message message="Record not found." />;

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<Link href="/assistance/records" className="mb-5 inline-flex text-sm font-semibold text-teal-800 hover:underline">Back to medical records</Link>
				<header className="mb-8 border-b border-slate-200 pb-6">
					<p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Medical record</p>
					<h1 className="text-3xl font-bold tracking-tight text-slate-950">{record.reference}</h1>
					<p className="mt-2 text-sm text-slate-600">{recordFate(record.recordFate)} · {recordStatus(record.recordStatus)}</p>
				</header>

				<Section title="Record and policy">
					<DetailsGrid entries={[
						["Record type", recordType(record.recordType)], ["Policy number", record.policyNumber],
						["Client company", record.clientCompany], ["Insurance company", record.insuranceCompany],
						["Intermediary", record.intermediary], ["Fate reason", record.fateReason],
					]} />
				</Section>
				<Section title="Report">
					<DetailsGrid entries={[
						["Reporting date", dateTime(record.reportingDate)], ["Reporter first name", record.reporterFirstName],
						["Reporter last name", record.reporterLastName], ["Reporter phone", record.reporterPhone],
						["Accident place", record.accidentPlace], ["Accident date", dateTime(record.accidentDate)],
					]} />
				</Section>
				<Section title="Victim">
					<DetailsGrid entries={[
						["First name", record.victimFirstName], ["Last name", record.victimLastName],
						["Phone", record.victimPhone], ["National ID", record.victimNationalId],
						["Job", record.victimJob], ["Accident cause", record.accidentCause],
					]} />
				</Section>
				<Section title="Evolution and status">
					<DetailsGrid entries={[
						["Evolution", record.accidentEvolution], ["Delegation date", dateTime(record.delegationDate)],
						["Coverage issued", record.coverageIssued === null ? null : record.coverageIssued ? "Yes" : "No"],
						["Coverage date", dateOnly(record.coverageDate)], ["Regulator", record.regulatorLabel],
						["Last action", dateTime(record.lastAction)], ["Managed by", record.managedBy], ["Observation", record.observation],
					]} />
				</Section>
				<Section title="Medical services">
					{services.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Service type", "Provider", "Mission date", "Mission place", "Observation"].map((label) => <th key={label} className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">{label}</th>)}</tr></thead><tbody>{services.map((service) => <tr key={service.id}><td className="px-3 py-3">{service.serviceTypeLabel}</td><td className="px-3 py-3">{service.providerLabel}</td><td className="px-3 py-3">{dateTime(service.missionDate)}</td><td className="px-3 py-3">{service.missionPlace ?? "-"}</td><td className="px-3 py-3">{service.observation ?? "-"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No services recorded.</p>}
				</Section>
				<Section title="Medical documents">
					{documents.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Type", "Service provider", "Signed", "Observation"].map((label) => <th key={label} className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">{label}</th>)}</tr></thead><tbody>{documents.map((document) => <tr key={document.id}><td className="px-3 py-3">{document.type}</td><td className="px-3 py-3">{document.providerLabel}</td><td className="px-3 py-3">{document.signed ? "Yes" : "No"}</td><td className="px-3 py-3">{document.observation ?? "-"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No documents recorded.</p>}
				</Section>
			</div>
		</section>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return <section className="mb-5 border-y border-slate-200 bg-white px-5 py-5"><h2 className="mb-4 text-base font-bold text-slate-900">{title}</h2>{children}</section>;
}

function DetailsGrid({ entries }: { entries: [string, string | number | Date | null][] }) {
	return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{entries.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{value instanceof Date ? dateTime(value) : value ?? "-"}</dd></div>)}</dl>;
}

function Message({ message }: { message: string }) {
	return <section className="px-8 py-12 text-sm text-slate-600">{message}</section>;
}

function dateTime(value: Date | null) {
	return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(value) : null;
}

function dateOnly(value: Date | null) {
	return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(value) : null;
}

function recordType(value: string) {
	return ({ AT: "Workplace accident", MD: "Illness & pain", VF: "Policy verification", SS: "Special service", PR: "Occupational disease" })[value] ?? value;
}

function recordStatus(value: string) {
	return ({ PROG: "In progress", SETT: "Settled", CLOS: "Closed", ABAN: "Abandoned", BILL: "Billed" })[value] ?? value;
}

function recordFate(value: string) {
	return value;
}
