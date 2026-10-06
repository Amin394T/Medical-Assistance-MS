import { Ambulance } from "lucide-react";

import { listServiceProviders } from "@/db/actions/serviceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function ServiceProvidersPage() {
	const providers = await listServiceProviders();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Services" title="Healthcare Providers" icon={<Ambulance />} />
				<ReferencialDataGrid title="Healthcare Providers" rows={providers} columns={[
					{ key: "label", label: "Label" },
					{ key: "corporateName", label: "Corporate Name" },
					{ key: "profile", label: "Profile", format: "label" },
					{ key: "contactName", label: "Contact Name" },
					{ key: "phone", label: "Phone" },
					{ key: "email", label: "Email" },
				]} />
			</div>
		</section>
	);
}
