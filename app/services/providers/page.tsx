import { Ambulance } from "lucide-react";

import { createServiceProvider, deleteServiceProvider, listServiceProviders, updateServiceProvider } from "@/db/actions/serviceProviders";
import { listProfiles } from "@/db/actions/serviceTypes";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
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
				<ReferencialDataGrid title="Healthcare Providers" rows={rows} columns={[
					{ key: "label", label: "Label", required: true },
					{ key: "profile", label: "Profile", format: "label", editor: "select", required: true, options: profiles.map((profile) => ({ value: profile, label: formatProfile(profile) })) },
					{ key: "contactName", label: "Contact Name", nullable: true },
					{ key: "phone", label: "Phone", required: true },
					{ key: "email", label: "Email", nullable: true },
				]} onCreate={createServiceProvider} onUpdate={updateServiceProvider} onDelete={deleteServiceProvider} filters={[
					{ key: "label", label: "Label" },
					{ key: "profile", label: "Profile", type: "select", options: profiles.map((profile) => ({ value: profile, label: formatProfile(profile) })) },
				]} />
			</div>
		</section>
	);
}

function formatProfile(profile: string) {
	return profile.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
