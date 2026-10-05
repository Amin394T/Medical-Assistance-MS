import { listServiceProviders } from "@/db/actions/serviceProviders";
import { EntityListTable } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { Ambulance } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServiceProvidersPage() {
	const providers = await listServiceProviders();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Services" title="Healthcare Providers" icon={<Ambulance className="h-6 w-6" aria-hidden="true" />} />
				<EntityListTable title="Healthcare Providers" rows={providers} columns={[
		{ key: "label", label: "Label" },
		{ key: "corporateName", label: "Corporate name" },
		{ key: "profile", label: "Profile", format: "label" },
		{ key: "contactName", label: "Contact name" },
		{ key: "phone", label: "Phone" },
		{ key: "email", label: "Email" },
				]} />
			</div>
		</section>
	);
}
