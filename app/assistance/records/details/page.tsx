import { getMedicalRecordDetails } from "@/db/actions/medicalRecords";
import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { listMedicalDocumentsForRecord } from "@/db/actions/medicalDocuments";
import { listMedicalServicesForRecord } from "@/db/actions/medicalServices";
import { listServiceProviders } from "@/db/actions/serviceProviders";
import { MedicalRecordEditForm } from "@/app/_components/medical-record-edit-form";

export const dynamic = "force-dynamic";

export default async function MedicalRecordDetailsPage({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const { id } = await searchParams;
	const recordId = Number(id);
	if (!Number.isInteger(recordId) || recordId < 1) return <Message message="Record not found." />;

	const [record, services, documents, policies, providers] = await Promise.all([
		getMedicalRecordDetails(recordId),
		listMedicalServicesForRecord(recordId),
		listMedicalDocumentsForRecord(recordId),
		listInsurancePolicies(),
		listServiceProviders(),
	]);
	if (!record) return <Message message="Record not found." />;

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<header className="mb-8 border-b border-slate-200 pb-6">
					<p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Medical record</p>
					<h1 className="text-3xl font-bold tracking-tight text-slate-950">{record.reference}</h1>
				</header>

				<MedicalRecordEditForm
					record={record}
					policies={policies.map(({ id, policyNumber, clientCompanyLabel, insuranceCompanyLabel, intermediateLabel }) => ({ id, policyNumber, clientCompanyLabel, insuranceCompanyLabel, intermediateLabel }))}
					regulators={providers.filter(({ profile }) => profile === "REGULATOR").map(({ id, label }) => ({ id, label }))}
				/>
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

function Message({ message }: { message: string }) {
	return <section className="px-8 py-12 text-sm text-slate-600">{message}</section>;
}

function dateTime(value: Date | null) {
	return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(value) : null;
}

function recordStatus(value: string) {
	return ({ PROG: "In progress", SETT: "Settled", CLOS: "Closed", ABAN: "Abandoned", BILL: "Billed" })[value] ?? value;
}
