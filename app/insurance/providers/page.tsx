import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { EntityListTable } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function InsuranceProvidersPage() {
	const providers = await listInsuranceProviders();

	return <EntityListTable title="Insurance Providers" section="Insurance" icon="building" rows={providers} columns={[
		{ key: "label", label: "Label" },
		{ key: "corporateName", label: "Corporate name" },
		{ key: "corporateId", label: "Corporate ID" },
		{ key: "type", label: "Type", format: "insuranceProviderType" },
		{ key: "phone", label: "Phone" },
		{ key: "email", label: "Email" },
	]} />;
}
