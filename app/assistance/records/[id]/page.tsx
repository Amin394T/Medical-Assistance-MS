import { ClipboardPen } from "lucide-react";

import { getMedicalRecord } from "@/db/actions/medicalRecords";
import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { createMedicalDocument, deleteMedicalDocument, listRecordMedicalDocuments, updateMedicalDocument } from "@/db/actions/medicalDocuments";
import { createMedicalService, deleteMedicalService, listRecordMedicalServices, updateMedicalService } from "@/db/actions/medicalServices";
import { listServiceProviders } from "@/db/actions/serviceProviders";
import { listServiceTypes } from "@/db/actions/serviceTypes";
import { MedicalRecordEditForm } from "@/app/_components/medical-record-edit-form";
import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";

export const dynamic = "force-dynamic";

export default async function MedicalRecordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const recordId = Number(id);
	if (!Number.isInteger(recordId) || recordId < 1) return <Message message="Record not found." />;

	const [record, services, documents, policies, providers, serviceTypes] = await Promise.all([
		getMedicalRecord(recordId),
		listRecordMedicalServices(recordId),
		listRecordMedicalDocuments(recordId),
		listInsurancePolicies(),
		listServiceProviders(),
		listServiceTypes(),
	]);
	if (!record) return <Message message="Record Not Found." />;

	const reference = `${record.type}-${String(record.reference).slice(0, -2)}-${String(record.reference).slice(-2)}`;

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<PageHeader section="Medical record" title={reference} icon={<ClipboardPen />} />

				<MedicalRecordEditForm
					record={record}
					policies={policies.map(({ id, policyNumber, clientCompany, insuranceCompany, intermediary }) => ({ id, policyNumber, clientCompany, insuranceCompany, intermediary }))}
				/>
				<Section title="Medical services">
					<ReferencialDataGrid
						title="Medical Services"
						rows={services.map(({ id, medicalRecordId, serviceProviderId, serviceTypeId, missionDate, missionPlace, observation }) => ({ id, medicalRecordId, serviceProviderId, serviceTypeId, missionDate, missionPlace, observation }))}
						columns={[
							{ key: "serviceTypeId", label: "Service Type", editor: "select", required: true, options: serviceTypes.map(({ id, label }) => ({ value: id, label })) },
							{ key: "serviceProviderId", label: "Provider", editor: "select", required: true, options: providers.map(({ id, label }) => ({ value: id, label })) },
							{ key: "missionDate", label: "Mission Date", editor: "date", format: "date", nullable: true },
							{ key: "missionPlace", label: "Mission Place", nullable: true },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createMedicalService.bind(null, recordId)}
						onUpdate={updateMedicalService}
						onDelete={deleteMedicalService}
					/>
				</Section>
				<Section title="Medical documents">
					<ReferencialDataGrid
						title="Medical Documents"
						rows={documents.map(({ id, medicalRecordId, type, serviceProviderId, observation, signed }) => ({ id, medicalRecordId, type, serviceProviderId, observation, signed }))}
						columns={[
							{ key: "type", label: "Type", required: true },
							{ key: "serviceProviderId", label: "Service Provider", editor: "select", nullable: true, options: [
								{ value: null, label: "None" },
								...providers.map(({ id, label }) => ({ value: id, label })),
							] },
							{ key: "signed", label: "Signed", editor: "checkbox" },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createMedicalDocument.bind(null, recordId)}
						onUpdate={updateMedicalDocument}
						onDelete={deleteMedicalDocument}
					/>
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
