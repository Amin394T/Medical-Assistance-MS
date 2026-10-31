import { createInsurancePolicy, deleteInsurancePolicy, listInsurancePolicies, updateInsurancePolicy } from "@/db/actions/insurancePolicies";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { ShieldHalf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const [policies, providers] = await Promise.all([listInsurancePolicies(), listInsuranceProviders()]);
	const rows = policies.map(({ id, policyNumber, clientCompany, effectiveDate, status, insuranceCompanyId, intermediaryId, creationDate, lastUpdated }) => ({
		id,
		policyNumber,
		clientCompany,
		effectiveDate,
		status,
		insuranceCompanyId,
		intermediaryId,
		creationDate,
		lastUpdated,
	}));
	const insuranceCompanyOptions = providers.filter((provider) => provider.type === "CMP").map((provider) => ({ value: provider.id, label: provider.label }));
	const intermediaryOptions = [
		{ value: null, label: "None" },
		...providers.filter((provider) => provider.type === "AGT" || provider.type === "BRK").map((provider) => ({ value: provider.id, label: provider.label })),
	];

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375 space-y-8">
				<PageHeader section="Insurance" title="Client Policies" icon={<ShieldHalf className="h-6 w-6" />} />
				<ReferencialDataGrid
					title="Client Policies"
					rows={rows}
					columns={[
						{ key: "policyNumber", label: "Policy Number", required: true, readOnly: true },
						{ key: "clientCompany", label: "Client Company", required: true, readOnly: true },
						{ key: "effectiveDate", label: "Effective Date", format: "date", readOnly: true },
						{ key: "status", label: "Status", readOnly: true, options: [
							{ value: "VALI", label: "Valid" },
							{ value: "RESU", label: "Resumed" },
							{ value: "SUSP", label: "Suspended" },
							{ value: "TERM", label: "Terminated" },
						] },
						{ key: "insuranceCompanyId", label: "Insurance Company", readOnly: true, options: insuranceCompanyOptions },
						{ key: "intermediaryId", label: "Intermediary", readOnly: true, options: intermediaryOptions },
						{ key: "creationDate", label: "Creation Date", format: "datetime", readOnly: true },
						{ key: "lastUpdated", label: "Last Updated", format: "datetime", readOnly: true },
					]}
					onCreate={createInsurancePolicy}
					onUpdate={updateInsurancePolicy}
					onDelete={deleteInsurancePolicy}
					readOnly
				/>
			</div>
		</section>
	);
}
