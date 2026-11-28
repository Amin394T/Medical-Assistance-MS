import { Ambulance } from "lucide-react";

import { listServiceProviders } from "@/db/actions/serviceProviders";
import { listProfiles } from "@/db/actions/serviceTypes";
import { ServiceProvidersTable } from "@/app/_components/service-providers-table";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function ServiceProvidersPage() {
	const [rows, profiles] = await Promise.all([
		listServiceProviders(),
		listProfiles(),
	]);

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Services" title="Healthcare Providers" icon={<Ambulance />} />
				<ServiceProvidersTable rows={rows} profiles={profiles} />
			</div>
		</section>
	);
}