import { listInsurancePolicies } from "@/db/actions/insurancePolicies";
import { InsurancePoliciesTable } from "@/app/_components/insurance-policies-table";
import { PageHeader } from "@/app/_components/page-header";
import { ShieldHalf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const rows = await listInsurancePolicies();
	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375 space-y-8">
				<PageHeader section="Insurance" title="Client Policies" icon={<ShieldHalf className="h-6 w-6" />} />
				<InsurancePoliciesTable rows={rows} />
			</div>
		</section>
	);
}
