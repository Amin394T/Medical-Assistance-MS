import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { EntityListTable } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const policies = await listInsurancePolicies();

	return <EntityListTable title="Client Policies" section="Insurance" icon="shield" rows={policies.map((policy) => ({ ...policy, nominativeList: policy.nominativeList.join(", ") }))} columns={[
		{ key: "policyNumber", label: "Policy number" },
		{ key: "clientCompany", label: "Client company" },
		{ key: "effectiveDate", label: "Effective date", format: "date" },
		{ key: "insuranceCompany", label: "Insurance company" },
		{ key: "intermediary", label: "Intermediary" },
		{ key: "terminated", label: "Terminated" },
		{ key: "terminationDate", label: "Termination date", format: "date" },
		{ key: "type", label: "Type", format: "policyType" },
	]} />;
}
