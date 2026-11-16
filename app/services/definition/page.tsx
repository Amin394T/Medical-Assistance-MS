import { createServiceType, deleteServiceType, listProfiles, listServiceTypesPage, updateServiceType } from "@/db/actions/serviceTypes";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { getGridListQuery } from "@/app/_lib/grid-list-query";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServiceTypesPage({ searchParams }: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const query = await getGridListQuery(searchParams, "id", false);
	const [list, profiles] = await Promise.all([listServiceTypesPage(query), listProfiles()]);

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Services" title="Medical Services" icon={<Activity className="h-6 w-6" />} />
				<ReferencialDataGrid key={JSON.stringify([list.search, list.sort, list.sortDesc])} title="Medical Services" rows={list.rows} columns={[
					{ key: "label", label: "Label", required: true },
					{ key: "paymentAmount", label: "Payment Amount", editor: "number", required: true },
					{ key: "billingAmount", label: "Billing Amount", editor: "number", required: true },
					{ key: "taxRate", label: "Tax Rate", editor: "number", required: true },
					{ key: "targetProfile", label: "Target Profile", editor: "combo-box", options: profiles.filter((profile): profile is string => profile !== null).map((profile) => ({ value: profile, label: profile })), required: true },
				]} onCreate={createServiceType} onUpdate={updateServiceType} onDelete={deleteServiceType} initialSearch={list.search} serverPagination={{
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
