import { createInsuranceProvider, deleteInsuranceProvider, listInsuranceProviderCommissions, listInsuranceProviders, updateInsuranceProvider, updateInsuranceProviderCommissions } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsuranceProvidersPage() {
	const rows = await listInsuranceProviders();

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Insurance" title="Insurance Providers" icon={<Building2 className="h-6 w-6" />} />
				<ReferencialDataGrid title="Insurance Providers" rows={rows} columns={[
					{ key: "label", label: "Label", required: true },
					{ key: "phone", label: "Phone", nullable: true },
					{ key: "email", label: "Email", nullable: true },
					{ key: "recordFees", label: "Record Fees", readOnly: true, dialogTitle: "Record Fees", dialogEditable: true },
				]} onCreate={createInsuranceProvider} onUpdate={updateInsuranceProvider} onDelete={deleteInsuranceProvider} filters={[
					{ key: "label", label: "Label" },
				]} loadDialogItems={listInsuranceProviderCommissions} saveDialogItems={updateInsuranceProviderCommissions} />
			</div>
		</section>
	);
}
