import { createInsuranceProvider, deleteInsuranceProvider, listInsuranceProvidersPage, updateInsuranceProvider } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { getGridListQuery } from "@/app/_lib/grid-list-query";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsuranceProvidersPage({ searchParams }: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const query = await getGridListQuery(searchParams, "id", false);
	const list = await listInsuranceProvidersPage(query);

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Insurance" title="Insurance Providers" icon={<Building2 className="h-6 w-6" />} />
				<ReferencialDataGrid key={JSON.stringify([list.search, list.sort, list.sortDesc])} title="Insurance Providers" rows={list.rows} columns={[
					{ key: "label", label: "Label", required: true },
					{ key: "corporateId", label: "Corporate ID", nullable: true },
					{ key: "phone", label: "Phone", nullable: true },
					{ key: "email", label: "Email", nullable: true },
				]} onCreate={createInsuranceProvider} onUpdate={updateInsuranceProvider} onDelete={deleteInsuranceProvider} initialSearch={list.search} serverPagination={{
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
