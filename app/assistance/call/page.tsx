import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { MedicalRecordCallForm } from "@/app/_components/medical-record-call-form";

export const dynamic = "force-dynamic";

export default async function CallPage() {
	const policies = await listInsurancePolicies();
	const now = new Date();

	return (
		<MedicalRecordCallForm
			policies={policies.map(({ id, policyNumber, clientCompany, insuranceCompany, intermediary, terminated, effectiveDate, terminationDate }) => ({
				id,
				policyNumber,
				clientCompanyLabel: clientCompany,
				insuranceCompanyLabel: insuranceCompany,
				intermediaryLabel: intermediary,
				terminated: terminated ?? false,
				effectiveDate: effectiveDate.toISOString(),
				terminationDate: terminationDate?.toISOString() ?? null,
			}))}
			displayReportingDate={now.toISOString()}
		/>
	);
}
