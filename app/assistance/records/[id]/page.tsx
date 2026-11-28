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

export const dynamic = "force-dynamic";

export default async function MedicalRecordDetailsPage({ params, searchParams }: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { id } = await params;
	const query = await searchParams;
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
	const providersByServiceType = Object.fromEntries(serviceTypes.map((serviceType) => [
		String(serviceType.id),
		providers.filter(({ profile }) => profile === serviceType.targetProfile).map(({ id, label }) => ({ value: id, label })),
	]));
	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<PageHeader section="Medical record" title={reference} icon={<ClipboardPen />} />

				<MedicalRecordEditForm
					record={record}
					jobs={jobs.filter((job): job is string => job !== null)}
					created={query.created === "1"}
				/>
				<section className="mb-8">
					<ReferencialDataGrid
						title="Medical Services"
						showTitle
						hideSearch
						rows={services.map(({ id, medicalRecordId, serviceProviderId, serviceTypeId, date, place, paymentAmount, billingAmount, taxRate, settlementId, settlementSettled, invoiceId, invoiceReference, observation }) => ({
							id,
							medicalRecordId,
							serviceProviderId,
							serviceTypeId,
							date,
							place,
							paymentAmount,
							billingAmount,
							taxRate,
							settlementId,
							settlementSettled,
							invoiceId,
							invoiceReference,
							invoiceHref: invoiceReference === null ? null : `/billing/settlements?search=${encodeURIComponent(String(invoiceReference))}`,
							observation,
						}))}
						columns={[
							{ key: "serviceTypeId", label: "Service Type", editor: "select", required: true, options: serviceTypes.map(({ id, label }) => ({ value: id, label })) },
							{ key: "serviceProviderId", label: "Provider", editor: "select", required: true, optionsBy: { dependencyKey: "serviceTypeId", values: providersByServiceType } },
							{ key: "date", label: "Date", editor: "date", format: "date", required: true },
							{ key: "place", label: "Place", nullable: true },
							{ key: "invoiceReference", label: "Invoice", readOnly: true, linkHrefKey: "invoiceHref" },
							{ key: "settlementSettled", label: "Settlement", readOnly: true, options: [{ value: true, label: "Settled" }, { value: false, label: "Not settled" }, { value: null, label: "-" }] },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createRecordMedicalService.bind(null, recordId)}
						onUpdate={updateMedicalService}
						onDelete={deleteMedicalService}
					/>
				</section>
				<section className="mb-8">
					<ReferencialDataGrid
						title="Medical Certificates"
						showTitle
						hideSearch
						rows={certificates.map(({ id, medicalRecordId, type, serviceProviderId, compensationRate, dayCount, startDate, endDate, observation }) => ({ id, medicalRecordId, type, serviceProviderId, compensationRate, dayCount, startDate, endDate, observation }))}
						columns={[
							{ key: "type", label: "Type", editor: "select", required: true, options: [
								{ value: "INIT", label: "Initial" }, { value: "PROL", label: "Prolongation" },
								{ value: "AGGR", label: "Aggravation" }, { value: "ABLA", label: "Ablation" },
								{ value: "RECO", label: "Recovery" }, { value: "WORK", label: "Return" }, { value: "RELA", label: "Relapse" },
							] },
							{ key: "serviceProviderId", label: "Service Provider", editor: "select", nullable: true, options: [
								{ value: null, label: "None" },
								...providers.map(({ id, label }) => ({ value: id, label })),
							] },
							{ key: "compensationRate", label: "Compensation Rate", editor: "number", nullable: true },
							{ key: "dayCount", label: "Day Count", editor: "number", required: true },
							{ key: "startDate", label: "Start Date", editor: "date", format: "date", nullable: true },
							{ key: "endDate", label: "End Date", editor: "date", format: "date", nullable: true },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createMedicalCertificate.bind(null, recordId)}
						onUpdate={updateMedicalCertificate}
						onDelete={deleteMedicalCertificate}
					/>
				</section>
			</div>
		</section>
	);
}

function Message({ message }: { message: string }) {
	return <section className="px-8 py-12 text-sm text-slate-600">{message}</section>;
}
