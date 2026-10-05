import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { EntityListTable } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsuranceProvidersPage() {
	const providers = await listInsuranceProviders();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Insurance" title="Insurance Providers" icon={<Building2 className="h-6 w-6" aria-hidden="true" />} />
				<EntityListTable title="Insurance Providers" rows={providers} columns={[
		{ key: "label", label: "Label" },
		{ key: "corporateName", label: "Corporate name" },
		{ key: "corporateId", label: "Corporate ID" },
		{ key: "type", label: "Type", format: "insuranceProviderType" },
		{ key: "phone", label: "Phone" },
		{ key: "email", label: "Email" },
				]} />
			</div>
		</section>
	);
}
