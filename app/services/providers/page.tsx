import { listServiceProviders } from "@/db/actions/serviceProviders";
import { EntityListTable, formatLabel } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function ServiceProvidersPage() {
	const providers = await listServiceProviders();

	return <EntityListTable title="Healthcare Providers" rows={providers} columns={[
		{ key: "label", label: "Label" },
		{ key: "name", label: "Name" },
		{ key: "profile", label: "Profile", format: formatLabel },
		{ key: "workerName", label: "Worker name" },
		{ key: "phone", label: "Phone" },
		{ key: "fax", label: "Fax" },
		{ key: "email", label: "Email" },
	]} />;
}
