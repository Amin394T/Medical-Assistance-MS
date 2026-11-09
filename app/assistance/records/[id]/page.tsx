import { ClipboardPen } from "lucide-react";

import { getMedicalRecord, listJobs } from "@/db/actions/medicalRecords";
import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { createMedicalCertificate, deleteMedicalCertificate, listRecordMedicalCertificates, updateMedicalCertificate } from "@/db/actions/medicalCertificates";
import { createRecordMedicalService, deleteMedicalService, listRecordMedicalServices, updateMedicalService } from "@/db/actions/medicalServices";
import { listServiceProviders } from "@/db/actions/serviceProviders";
import { listServiceTypes } from "@/db/actions/serviceTypes";
import { listInvoices } from "@/db/actions/invoices";
import { MedicalRecordEditForm } from "@/app/_components/medical-record-edit-form";
import { PageHeader } from "@/app/_components/page-header";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";

export const dynamic = "force-dynamic";

export default async function MedicalRecordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const recordId = Number(id);
	if (!Number.isInteger(recordId) || recordId < 1) return <Message message="Record not found." />;

	const [record, services, certificates, policies, providers, serviceTypes, jobs, invoices] = await Promise.all([
		getMedicalRecord(recordId),
		listRecordMedicalServices(recordId),
		listRecordMedicalCertificates(recordId),
		listInsurancePolicies(),
		listServiceProviders(),
		listServiceTypes(),
		listJobs(),
		listInvoices(),
	]);
	if (!record) return <Message message="Record Not Found." />;

	const referenceValue = String(record.reference);
	const reference = `${record.accidentType}-${referenceValue.slice(0, -2)}-${referenceValue.slice(-2)}`;
	const serviceTypesByProvider = Object.fromEntries(providers.map((provider) => [
		String(provider.id),
		serviceTypes.filter(({ targetProfile }) => targetProfile === provider.profile).map(({ id, label }) => ({ value: id, label })),
	]));
	const defaultServiceAmounts = [
		{ fieldKey: "paymentAmount", values: Object.fromEntries(serviceTypes.map(({ id, paymentAmount }) => [String(id), paymentAmount])) },
		{ fieldKey: "billingAmount", values: Object.fromEntries(serviceTypes.map(({ id, billingAmount }) => [String(id), billingAmount])) },
		{ fieldKey: "taxRate", values: Object.fromEntries(serviceTypes.map(({ id, taxRate }) => [String(id), taxRate])) },
	];
	const invoiceOptions = [
		{ value: null, label: "None" },
		...invoices.map(({ id, reference, insuranceProvider }) => ({ value: id, label: `${reference} - ${insuranceProvider}` })),
	];

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<PageHeader section="Medical record" title={reference} icon={<ClipboardPen />} />

				<MedicalRecordEditForm
					record={record}
					policies={policies.map(({ id, policyNumber, clientCompany, insuranceCompany, intermediary }) => ({ id, policyNumber, clientCompany, insuranceCompany, intermediary }))}
					jobs={jobs.filter((job): job is string => job !== null)}
				/>
				<Section title="Medical Services">
					<ReferencialDataGrid
						title="Medical Services"
						rows={services.map(({ id, medicalRecordId, serviceProviderId, serviceTypeId, date, paymentAmount, billingAmount, taxRate, settlementStatus, settlingDate, bank, paymentMode, paymentReference, invoiceId, observation }) => ({ id, medicalRecordId, serviceProviderId, serviceTypeId, date, paymentAmount, billingAmount, taxRate, settlementStatus, settlingDate, bank, paymentMode, paymentReference, invoiceId, observation }))}
						columns={[
							{ key: "serviceTypeId", label: "Service Type", editor: "select", required: true, optionsBy: { dependencyKey: "serviceProviderId", values: serviceTypesByProvider }, defaultFieldsByOption: defaultServiceAmounts },
							{ key: "serviceProviderId", label: "Provider", editor: "select", required: true, options: providers.map(({ id, label }) => ({ value: id, label })) },
							{ key: "date", label: "Service Date", editor: "date", format: "date", nullable: true },
							{ key: "paymentAmount", label: "Payment Amount", editor: "number" },
							{ key: "billingAmount", label: "Billing Amount", editor: "number" },
							{ key: "taxRate", label: "Tax Rate", editor: "number" },
							{ key: "settlementStatus", label: "Settlement Status", editor: "select", required: true, options: [{ value: "WAIT", label: "Waiting" }, { value: "BILL", label: "Billed" }, { value: "SETT", label: "Settled" }] },
							{ key: "settlingDate", label: "Settling Date", editor: "date", format: "date", nullable: true },
							{ key: "bank", label: "Bank", nullable: true },
							{ key: "paymentMode", label: "Payment Mode", editor: "select", nullable: true, options: [{ value: null, label: "None" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" }] },
							{ key: "paymentReference", label: "Payment Reference", nullable: true },
							{ key: "invoiceId", label: "Invoice", editor: "select", nullable: true, options: invoiceOptions },
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
