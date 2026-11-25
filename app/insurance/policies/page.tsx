import { listInsurancePolicies, listInsurancePolicyEmployees } from "@/db/actions/insurancePolicies";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { ShieldHalf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const [list, providers] = await Promise.all([listInsurancePolicies(), listInsuranceProviders()]);
	const rows = list.map(({ id, policyNumber, clientCompany, clientActivity, clientAddress, clientCity, type, status, statusDate, uploadDate, insuranceProviderId }) => ({
		id,
		policyNumber,
		clientCompany,
		clientActivity,
		clientAddress,
		clientCity,
		type,
		status,
		statusDate,
		uploadDate,
		insuranceProviderId,
	}));
	const insuranceProviderOptions = providers.map((provider) => ({ value: provider.id, label: provider.label }));

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375 space-y-8">
				<PageHeader section="Insurance" title="Client Policies" icon={<ShieldHalf className="h-6 w-6" />} />
				<ReferencialDataGrid
					title="Client Policies"
					rows={rows}
					loadDialogItems={listInsurancePolicyEmployees}
					columns={[
						{ key: "policyNumber", label: "Policy Number", required: true, readOnly: true },
						{ key: "clientCompany", label: "Client Company", required: true, readOnly: true },
						{ key: "clientActivity", label: "Client Activity", readOnly: true },
						{ key: "clientAddress", label: "Client Address", readOnly: true },
						{ key: "clientCity", label: "Client City", readOnly: true },
						{ key: "type", label: "Type", readOnly: true, options: [
							{ value: "GLB", label: "Global" }, { value: "NMT", label: "Nominative" },
						], dialogTitle: "Covered Employees", dialogValues: ["NMT"] },
						{ key: "status", label: "Status", readOnly: true, options: [
							{ value: "VLD", label: "Valid" },
							{ value: "SPD", label: "Suspended" },
							{ value: "TRM", label: "Terminated" },
						], badgeClasses: {
							VLD: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
							SPD: "bg-amber-50 text-amber-700 ring-amber-600/20",
							TRM: "bg-rose-50 text-rose-700 ring-rose-600/20",
						} },
						{ key: "statusDate", label: "Status Date", format: "date", readOnly: true },
						{ key: "uploadDate", label: "Upload Date", format: "datetime", readOnly: true },
						{ key: "insuranceProviderId", label: "Insurance Provider", readOnly: true, options: insuranceProviderOptions },
					]}
					readOnly
					filters={[
						{ key: "policyNumber", label: "Policy Number" },
						{ key: "clientCompany", label: "Client Company" },
						{ key: "status", label: "Status", type: "select", options: [
							{ value: "VLD", label: "Valid" }, { value: "SPD", label: "Suspended" }, { value: "TRM", label: "Terminated" },
						] },
					]}
				/>
			</div>
		</section>
	);
}
