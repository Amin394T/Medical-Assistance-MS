import { listServiceTypes } from "@/db/actions/serviceTypes";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServiceTypesPage() {
	const serviceTypes = await listServiceTypes();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Services" title="Medical Services" icon={<Activity className="h-6 w-6" />} />
				<ReferencialDataGrid title="Medical Services" rows={serviceTypes} columns={[
		{ key: "label", label: "Label" },
		{ key: "targetProfile", label: "Target Profile" },
				]} />
			</div>
		</section>
	);
}
