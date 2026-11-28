import { Activity } from "lucide-react";
import { listProfiles, listServiceTypes } from "@/db/actions/serviceTypes";
import { ServiceTypesTable } from "@/app/_components/service-types-table";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function ServiceTypesPage() {
	const [rows, profiles] = await Promise.all([listServiceTypes(), listProfiles()]);

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Services" title="Medical Services" icon={<Activity className="h-6 w-6" />} />
				<ServiceTypesTable rows={rows} profiles={profiles} />
			</div>
		</section>
	);
}
