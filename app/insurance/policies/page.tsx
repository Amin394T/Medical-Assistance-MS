import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { EntityListTable, formatDate, formatLabel } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const policies = await listInsurancePolicies();

	return <EntityListTable title="Client Policies" rows={policies} columns={[
		{ key: "policyNumber", label: "Policy number" },
		{ key: "clientCompanyLabel", label: "Client company" },
		{ key: "effectiveDate", label: "Effective date", format: formatDate },
		{ key: "insuranceCompanyLabel", label: "Insurance company" },
		{ key: "intermediateLabel", label: "Intermediate" },
		{ key: "terminated", label: "Terminated" },
		{ key: "terminationDate", label: "Termination date", format: formatDate },
		{ key: "type", label: "Type", format: formatLabel },
	]} />;
}
