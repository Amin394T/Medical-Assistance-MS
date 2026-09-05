import { listMedicalServices } from "@/db/actions/medicalServices";
import { EntityListTable, formatDateTime } from "@/app/_components/entity-list-table";

export const dynamic = "force-dynamic";

export default async function ServiceHistoryPage() {
	const services = await listMedicalServices();

	return <EntityListTable title="Service History" rows={services} columns={[
		{ key: "recordReference", label: "Record reference" },
		{ key: "service", label: "Service" },
		{ key: "providerLabel", label: "Provider" },
		{ key: "missionDate", label: "Mission date", format: formatDateTime },
		{ key: "missionPlace", label: "Mission place" },
		{ key: "observations", label: "Observations" },
		{ key: "settled", label: "Settled" },
	]} />;
}
