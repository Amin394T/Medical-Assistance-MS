import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { MedicalRecordCallForm } from "@/app/_components/medical-record-call-form";
import { PageHeader } from "@/app/_components/page-header";
import { Headset } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CallPage() {
	const policies = await listInsurancePolicies();
	const now = new Date();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<PageHeader section="Assistance" title="Emergency Call" icon={<Headset className="h-6 w-6" aria-hidden="true" />} />
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
			</div>
		</section>
	);
}
