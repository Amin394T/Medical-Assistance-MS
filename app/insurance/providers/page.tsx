import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { InsuranceProvidersTable } from "@/app/_components/insurance-providers-table";
import { PageHeader } from "@/app/_components/page-header";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsuranceProvidersPage() {
	const rows = await listInsuranceProviders();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Insurance" title="Insurance Providers" icon={<Building2 className="h-6 w-6" />} />
				<InsuranceProvidersTable rows={rows} />
			</div>
		</section>
	);
}
