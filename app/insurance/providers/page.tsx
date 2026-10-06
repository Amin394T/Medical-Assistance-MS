import { createInsuranceProvider, deleteInsuranceProvider, listInsuranceProviders, updateInsuranceProvider } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsuranceProvidersPage() {
	const providers = await listInsuranceProviders();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Insurance" title="Insurance Providers" icon={<Building2 className="h-6 w-6" />} />
				<ReferencialDataGrid title="Insurance Providers" rows={providers} columns={[
					{ key: "label", label: "Label", required: true },
					{ key: "corporateName", label: "Corporate Name", nullable: true },
					{ key: "corporateId", label: "Corporate ID", nullable: true },
					{ key: "type", label: "Type", editor: "select", required: true, options: [
						{ value: "CMP", label: "Company" }, { value: "AGT", label: "Agent" }, { value: "BRK", label: "Broker" },
					] },
					{ key: "phone", label: "Phone", nullable: true },
					{ key: "email", label: "Email", nullable: true },
				]} onCreate={createInsuranceProvider} onUpdate={updateInsuranceProvider} onDelete={deleteInsuranceProvider} />
			</div>
		</section>
	);
}
