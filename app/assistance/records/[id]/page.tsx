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
				<PageHeader section="Dossier Médical" title={reference} icon={<ClipboardPen />} />

				<MedicalRecordEditForm
					record={record}
					jobs={jobs.filter((job): job is string => job !== null)}
					created={query.created === "1"}
				/>
				<Section title="Services Médicaux">
					<ReferencialDataGrid
						title="Services Médicaux"
						rows={services.map(({ id, medicalRecordId, serviceProviderId, serviceTypeId, date, paymentAmount, billingAmount, taxRate, settlementStatus, settlingDate, bank, paymentMode, paymentReference, invoiceId, invoiceReference, observation }) => ({
							id,
							medicalRecordId,
							serviceProviderId,
							serviceTypeId,
							date,
							paymentAmount,
							billingAmount,
							taxRate,
							settlementStatus,
							settlingDate,
							bank,
							paymentMode,
							paymentReference,
							invoiceId,
							invoiceReference,
							invoiceHref: invoiceReference === null ? null : `/billing/settlements?search=${encodeURIComponent(String(invoiceReference))}`,
							observation,
						}))}
						columns={[
							{ key: "serviceTypeId", label: "Type de Prestation", editor: "select", required: true, options: serviceTypes.map(({ id, label }) => ({ value: id, label })) },
							{ key: "serviceProviderId", label: "Prestataire", editor: "select", required: true, optionsBy: { dependencyKey: "serviceTypeId", values: providersByServiceType } },
							{ key: "date", label: "Date de la Prestation", editor: "date", format: "date", nullable: true },
							{ key: "settlementStatus", label: "Statut du Règlement", readOnly: true, options: [{ value: "WAIT", label: "En Attente" }, { value: "BILL", label: "Facturée" }, { value: "SETT", label: "Réglée" }], badgeClasses: settlementStatusBadgeClasses },
							{ key: "invoiceReference", label: "Facture", readOnly: true, linkHrefKey: "invoiceHref" },
							{ key: "settlingDate", label: "Date de Règlement", format: "date", readOnly: true },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createRecordMedicalService.bind(null, recordId)}
						onUpdate={updateMedicalService}
						onDelete={deleteMedicalService}
					/>
				</Section>
				<Section title="Certificats Médicaux">
					<ReferencialDataGrid
						title="Certificats Médicaux"
						rows={certificates.map(({ id, medicalRecordId, type, serviceProviderId, dayCount, startDate, endDate, observation }) => ({ id, medicalRecordId, type, serviceProviderId, dayCount, startDate, endDate, observation }))}
						columns={[
							{ key: "type", label: "Type", editor: "select", required: true, options: [
								{ value: "INIT", label: "Initial" }, { value: "PROL", label: "Prolongation" }, { value: "RETU", label: "Reprise" },
								{ value: "AGGR", label: "Aggravation" }, { value: "INSP", label: "Contrôle" }, { value: "RECO", label: "Guérison" },
							] },
							{ key: "serviceProviderId", label: "Prestataire de Soins", editor: "select", nullable: true, options: [
								{ value: null, label: "Aucun" },
								...providers.map(({ id, label }) => ({ value: id, label })),
							] },
							{ key: "dayCount", label: "Nombre de Jours", editor: "number", required: true },
							{ key: "startDate", label: "Date de Début", editor: "date", format: "date", nullable: true },
							{ key: "endDate", label: "Date de Fin", editor: "date", format: "date", nullable: true },
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
