import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { EntityListTable, formatLabel } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function InsuranceProvidersPage() {
	const providers = await listInsuranceProviders();

	return <EntityListTable title="Insurance Providers" icon="building" rows={providers} columns={[
		{ key: "label", label: "Label" },
		{ key: "companyName", label: "Company name" },
		{ key: "companyId", label: "Company ID" },
		{ key: "type", label: "Type", format: formatLabel },
		{ key: "phone", label: "Phone" },
		{ key: "fax", label: "Fax" },
		{ key: "email", label: "Email" },
	]} />;
}
