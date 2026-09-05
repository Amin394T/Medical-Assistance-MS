import { listInsuranceClients } from "@/db/actions/insuranceClients";
import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { listMedicalRecords } from "@/db/actions/medicalRecords";
import { MedicalRecordCallForm } from "@/app/_components/medical-record-call-form";

export const dynamic = "force-dynamic";

export default async function CallPage() {
	const [clients, policies, providers, records] = await Promise.all([
		listInsuranceClients(),
		listInsurancePolicies(),
		listInsuranceProviders(),
		listMedicalRecords(),
	]);
	const now = new Date();
	const datePart = now.toISOString().slice(2, 10).replaceAll("-", "");
	const referencePrefix = `AT/${datePart}/`;
	const nextSequence = records.reduce((highest, record) => {
		if (!record.referenceNumber.startsWith(referencePrefix)) return highest;
		const sequence = Number(record.referenceNumber.split("/").at(-1));
		return Number.isNaN(sequence) ? highest : Math.max(highest, sequence);
	}, 0) + 1;
	const displayReference = `${referencePrefix}${String(nextSequence).padStart(3, "0")}`.replaceAll("/", "-");

	return (
		<MedicalRecordCallForm
			clients={clients.map(({ id, label }) => ({ id, label }))}
			policies={policies.map(({ id, clientCompanyId, policyNumber, insuranceCompanyId, terminated, effectiveDate }) => ({
				id,
				clientCompanyId,
				policyNumber,
				insuranceCompanyId,
				terminated,
				effectiveDate: effectiveDate?.toISOString() ?? null,
			}))}
			providers={providers.map(({ id, label, type }) => ({ id, label, type }))}
			previousRecords={records.map(({ id, referenceNumber, clientCompanyId, victimFirstName, victimLastName }) => ({
				id,
				referenceNumber,
				clientCompanyId,
				victimName: `${victimFirstName} ${victimLastName}`,
			}))}
			displayReference={displayReference}
			displayReportingDate={now.toISOString()}
		/>
	);
}
