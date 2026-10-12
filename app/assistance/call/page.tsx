import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { listJobs } from "@/db/actions/medicalRecords";
import { MedicalRecordCallForm } from "@/app/_components/medical-record-call-form";
import { PageHeader } from "@/app/_components/page-header";
import { Headset } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CallPage() {
	const [policies, jobs] = await Promise.all([listInsurancePolicies(), listJobs()]);
	const now = new Date();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-6xl">
				<PageHeader section="Assistance" title="Emergency Call" icon={<Headset className="h-6 w-6" />} />
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
			jobs={jobs.filter((job): job is string => job !== null)}
			displayReportingDate={now.toISOString()}
				/>
			</div>
		</section>
	);
}
