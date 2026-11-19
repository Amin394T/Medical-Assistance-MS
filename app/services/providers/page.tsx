import { Ambulance } from "lucide-react";

import { createServiceProvider, deleteServiceProvider, listServiceProviderBanks, listServiceProvidersPage, updateServiceProvider } from "@/db/actions/serviceProviders";
import { listProfiles } from "@/db/actions/serviceTypes";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { getGridListQuery } from "@/app/_lib/grid-list-query";

export const dynamic = "force-dynamic";

export default async function ServiceProvidersPage({ searchParams }: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const query = await getGridListQuery(searchParams, "id", false);
	const [list, profiles, banks] = await Promise.all([
		listServiceProvidersPage(query),
		listProfiles(),
		listServiceProviderBanks(),
	]);

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Services" title="Healthcare Providers" icon={<Ambulance />} />
				<ReferencialDataGrid key={JSON.stringify([list.search, list.sort, list.sortDesc])} title="Healthcare Providers" rows={list.rows} columns={[
					{ key: "label", label: "Label", required: true },
					{ key: "corporateName", label: "Corporate Name", nullable: true },
					{ key: "profile", label: "Profile", format: "label", editor: "select", required: true, options: profiles.map((profile) => ({ value: profile, label: formatProfile(profile) })) },
					{ key: "contactName", label: "Contact Name", nullable: true },
					{ key: "phone", label: "Phone", required: true },
					{ key: "email", label: "Email", nullable: true },
					{ key: "bank", label: "Bank", editor: "combo-box", nullable: true, options: banks.map((bank) => ({ value: bank, label: bank })) },
					{ key: "bankAccount", label: "Bank Account", nullable: true },
				]} onCreate={createServiceProvider} onUpdate={updateServiceProvider} onDelete={deleteServiceProvider} initialSearch={list.search} serverPagination={{
					page: list.page,
					pageSize: list.pageSize,
					totalCount: list.totalCount,
					sort: list.sort,
					sortDesc: list.sortDesc,
					defaultSort: "id",
					defaultSortDesc: false,
				}} />
			</div>
		</section>
	);
}

function formatProfile(profile: string) {
	return profile.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
