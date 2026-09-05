import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { EntityListTable, formatLabel } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function InsuranceCompaniesPage() {
	const providers = await listInsuranceProviders();

	return <EntityListTable title="Insurance companies" description="Manage insurers, agents, and brokers used across the assistance workflow." rows={providers} columns={[
		{ key: "label", label: "Label" },
		{ key: "companyName", label: "Company name" },
		{ key: "companyId", label: "Company ID" },
		{ key: "type", label: "Type", format: formatLabel },
		{ key: "phone", label: "Phone" },
		{ key: "fax", label: "Fax" },
		{ key: "email", label: "Email" },
	]} />;
}
