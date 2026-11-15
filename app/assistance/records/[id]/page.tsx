import { ClipboardPen } from "lucide-react";

import { getMedicalRecord, listJobs } from "@/db/actions/medicalRecords";
import { createMedicalCertificate, deleteMedicalCertificate, listRecordMedicalCertificates, updateMedicalCertificate } from "@/db/actions/medicalCertificates";
import { createRecordMedicalService, deleteMedicalService, listRecordMedicalServices, updateMedicalService } from "@/db/actions/medicalServices";
import { listServiceProviders } from "@/db/actions/serviceProviders";
import { listServiceTypes } from "@/db/actions/serviceTypes";
import { MedicalRecordEditForm } from "@/app/_components/medical-record-edit-form";
import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";
import { settlementStatusBadgeClasses } from "@/app/_lib/status-colors";

export const dynamic = "force-dynamic";

export default async function MedicalRecordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const recordId = Number(id);
	if (!Number.isInteger(recordId) || recordId < 1) return <Message message="Record not found." />;

	const [record, services, certificates, providers, serviceTypes, jobs] = await Promise.all([
		getMedicalRecord(recordId),
		listRecordMedicalServices(recordId),
		listRecordMedicalCertificates(recordId),
		listServiceProviders(),
		listServiceTypes(),
		listJobs(),
	]);
	if (!record) return <Message message="Record Not Found." />;

	const reference = formatMedicalRecordReference(record.accidentType, record.reference);
	const serviceTypesByProvider = Object.fromEntries(providers.map((provider) => [
		String(provider.id),
		serviceTypes.filter(({ targetProfile }) => targetProfile === provider.profile).map(({ id, label }) => ({ value: id, label })),
	]));
	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<PageHeader section="Medical record" title={reference} icon={<ClipboardPen />} />

				<MedicalRecordEditForm
					record={record}
					jobs={jobs.filter((job): job is string => job !== null)}
				/>
				<Section title="Medical Services">
					<ReferencialDataGrid
						title="Medical Services"
						rows={services.map(({ id, medicalRecordId, serviceProviderId, serviceTypeId, date, paymentAmount, billingAmount, taxRate, settlementStatus, settlingDate, bank, paymentMode, paymentReference, invoiceId, observation }) => ({ id, medicalRecordId, serviceProviderId, serviceTypeId, date, paymentAmount, billingAmount, taxRate, settlementStatus, settlingDate, bank, paymentMode, paymentReference, invoiceId, observation }))}
						columns={[
							{ key: "serviceTypeId", label: "Service Type", editor: "select", required: true, optionsBy: { dependencyKey: "serviceProviderId", values: serviceTypesByProvider } },
							{ key: "serviceProviderId", label: "Provider", editor: "select", required: true, options: providers.map(({ id, label }) => ({ value: id, label })) },
							{ key: "date", label: "Service Date", editor: "date", format: "date", nullable: true },
							{ key: "settlementStatus", label: "Settlement Status", readOnly: true, options: [{ value: "WAIT", label: "Waiting" }, { value: "BILL", label: "Billed" }, { value: "SETT", label: "Settled" }], badgeClasses: settlementStatusBadgeClasses },
							{ key: "settlingDate", label: "Settling Date", format: "date", readOnly: true },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createRecordMedicalService.bind(null, recordId)}
						onUpdate={updateMedicalService}
						onDelete={deleteMedicalService}
					/>
				</Section>
				<Section title="Medical Certificates">
					<ReferencialDataGrid
						title="Medical Certificates"
						rows={certificates.map(({ id, medicalRecordId, type, serviceProviderId, dayCount, startDate, endDate, observation }) => ({ id, medicalRecordId, type, serviceProviderId, dayCount, startDate, endDate, observation }))}
						columns={[
							{ key: "type", label: "Type", editor: "select", required: true, options: [
								{ value: "INIT", label: "Initial" }, { value: "PROL", label: "Prolongation" }, { value: "RETU", label: "Return" },
								{ value: "AGGR", label: "Aggravation" }, { value: "INSP", label: "Inspection" }, { value: "RECO", label: "Recovery" },
							] },
							{ key: "serviceProviderId", label: "Service Provider", editor: "select", nullable: true, options: [
								{ value: null, label: "None" },
								...providers.map(({ id, label }) => ({ value: id, label })),
							] },
							{ key: "dayCount", label: "Day Count", editor: "number", required: true },
							{ key: "startDate", label: "Start Date", editor: "date", format: "date", nullable: true },
							{ key: "endDate", label: "End Date", editor: "date", format: "date", nullable: true },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createMedicalCertificate.bind(null, recordId)}
						onUpdate={updateMedicalCertificate}
						onDelete={deleteMedicalCertificate}
					/>
				</Section>
			</div>
		</section>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6"><div className="mb-6 border-b border-slate-100 pb-4"><h2 className="text-xl font-bold text-teal-800">{title}</h2></div>{children}</section>;
}

function Message({ message }: { message: string }) {
	return <section className="px-8 py-12 text-sm text-slate-600">{message}</section>;
}
