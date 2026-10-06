import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { ShieldHalf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const policies = await listInsurancePolicies();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Insurance" title="Client Policies" icon={<ShieldHalf className="h-6 w-6" />} />
				<ReferencialDataGrid title="Client Policies" rows={policies.map((policy) => ({ ...policy, nominativeList: policy.nominativeList.join(", ") }))} columns={[
		{ key: "policyNumber", label: "Policy number" },
		{ key: "clientCompany", label: "Client company" },
		{ key: "effectiveDate", label: "Effective date", format: "date" },
		{ key: "insuranceCompany", label: "Insurance company" },
		{ key: "intermediary", label: "Intermediary" },
		{ key: "terminated", label: "Terminated" },
		{ key: "terminationDate", label: "Termination date", format: "date" },
		{ key: "type", label: "Type", format: "policyType" },
				]} />
			</div>
		</section>
	);
}
