import { listServiceTypes } from "@/db/actions/serviceTypes";
import { EntityListTable } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function ServiceTypesPage() {
	const serviceTypes = await listServiceTypes();

	return <EntityListTable title="Service Types" icon="activity" rows={serviceTypes} columns={[
		{ key: "label", label: "Label" },
		{ key: "targetProfile", label: "Target profile" },
	]} />;
}
