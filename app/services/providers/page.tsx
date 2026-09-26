import { listServiceProviders } from "@/db/actions/serviceProviders";
import { EntityListTable } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function ServiceProvidersPage() {
	const providers = await listServiceProviders();

	return <EntityListTable title="Healthcare Providers" icon="ambulance" rows={providers} columns={[
		{ key: "label", label: "Label" },
		{ key: "corporateName", label: "Corporate name" },
		{ key: "profile", label: "Profile", format: "label" },
		{ key: "contactName", label: "Contact name" },
		{ key: "phone", label: "Phone" },
		{ key: "email", label: "Email" },
	]} />;
}
