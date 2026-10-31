import { ClipboardPen } from "lucide-react";

import { getMedicalRecord, listJobs } from "@/db/actions/medicalRecords";
import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { createMedicalCertificate, deleteMedicalCertificate, listRecordMedicalCertificates, updateMedicalCertificate } from "@/db/actions/medicalCertificates";
import { createMedicalService, deleteMedicalService, listRecordMedicalServices, updateMedicalService } from "@/db/actions/medicalServices";
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
	const reference = `${record.type}-${referenceValue.slice(0, -2)}-${referenceValue.slice(-2)}`;
	const serviceTypesByProvider = Object.fromEntries(providers.map((provider) => [
		String(provider.id),
		serviceTypes.filter(({ targetProfile }) => targetProfile === provider.profile).map(({ id, label }) => ({ value: id, label })),
	]));
	const defaultFees = Object.fromEntries(serviceTypes.map(({ id, defaultFee }) => [String(id), defaultFee]));
	const invoiceOptions = [
		{ value: null, label: "None" },
		...invoices.map(({ id, date, insuranceProvider }) => ({ value: id, label: `${date.toLocaleDateString()} - ${insuranceProvider}` })),
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
						rows={services.map(({ id, medicalRecordId, serviceProviderId, serviceTypeId, serviceDate, feeAmount, billedAmount, taxRate, billingStatus, settlingDate, bank, paymentMode, paymentReference, invoiceId, observation }) => ({ id, medicalRecordId, serviceProviderId, serviceTypeId, serviceDate, feeAmount, billedAmount, taxRate, billingStatus, settlingDate, bank, paymentMode, paymentReference, invoiceId, observation }))}
						columns={[
							{ key: "serviceTypeId", label: "Service Type", editor: "select", required: true, optionsBy: { dependencyKey: "serviceProviderId", values: serviceTypesByProvider }, defaultFieldByOption: { fieldKey: "feeAmount", values: defaultFees } },
							{ key: "serviceProviderId", label: "Provider", editor: "select", required: true, options: providers.map(({ id, label }) => ({ value: id, label })) },
							{ key: "serviceDate", label: "Service Date", editor: "date", format: "date", nullable: true },
							{ key: "feeAmount", label: "Fee Amount", editor: "number", nullable: true },
							{ key: "billedAmount", label: "Billed Amount", editor: "number", nullable: true },
							{ key: "taxRate", label: "Tax Rate", editor: "number", nullable: true },
							{ key: "billingStatus", label: "Billing Status", editor: "select", required: true, options: [{ value: "WTN", label: "Waiting" }, { value: "BLD", label: "Billed" }, { value: "STL", label: "Settled" }] },
							{ key: "settlingDate", label: "Settling Date", editor: "date", format: "date", nullable: true },
							{ key: "bank", label: "Bank", nullable: true },
							{ key: "paymentMode", label: "Payment Mode", editor: "select", nullable: true, options: [{ value: null, label: "None" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" }] },
							{ key: "paymentReference", label: "Payment Reference", nullable: true },
							{ key: "invoiceId", label: "Invoice", editor: "select", nullable: true, options: invoiceOptions },
							{ key: "observation", label: "Observation", nullable: true },
						]}
						onCreate={createMedicalService.bind(null, recordId)}
						onUpdate={updateMedicalService}
						onDelete={deleteMedicalService}
					/>
				</Section>
				<Section title="Medical Certificates">
					<ReferencialDataGrid
					title="Medical Certificates"
					rows={certificates.map(({ id, medicalRecordId, type, serviceProviderId, daysNumber, startDate, endDate, observation }) => ({ id, medicalRecordId, type, serviceProviderId, daysNumber, startDate, endDate, observation }))}
						columns={[
						{ key: "type", label: "Type", editor: "select", required: true, options: [
							{ value: "INIT", label: "Initial" }, { value: "PRLG", label: "Prolongation" }, { value: "RTRN", label: "Return" },
							{ value: "AGRV", label: "Aggravation" }, { value: "INSP", label: "Inspection" }, { value: "RCVR", label: "Recovery" },
						] },
						{ key: "serviceProviderId", label: "Service Provider", editor: "select", nullable: true, options: [
							{ value: null, label: "None" },
							...providers.map(({ id, label }) => ({ value: id, label })),
						] },
						{ key: "daysNumber", label: "Days Number", editor: "number", required: true },
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
