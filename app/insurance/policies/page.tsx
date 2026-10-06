import { createInsurancePolicy, deleteInsurancePolicy, listInsurancePolicies, updateInsurancePolicy } from "@/db/actions/insurancePolicies";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { ShieldHalf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const [policies, providers] = await Promise.all([listInsurancePolicies(), listInsuranceProviders()]);
	const rows = policies.map(({ id, policyNumber, clientCompany, effectiveDate, insuranceCompanyId, intermediaryId, terminated, terminationDate, type, nominativeList }) => ({
		id,
		policyNumber,
		clientCompany,
		effectiveDate,
		insuranceCompanyId,
		intermediaryId,
		terminated,
		terminationDate,
		type,
		nominativeList: nominativeList.join(", "),
	}));
	const insuranceCompanyOptions = providers.filter((provider) => provider.type === "CMP").map((provider) => ({ value: provider.id, label: provider.label }));
	const intermediaryOptions = [
		{ value: null, label: "None" },
		...providers.filter((provider) => provider.type === "AGT" || provider.type === "BRK").map((provider) => ({ value: provider.id, label: provider.label })),
	];

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375">
				<PageHeader section="Insurance" title="Client Policies" icon={<ShieldHalf className="h-6 w-6" />} />
				<ReferencialDataGrid title="Client Policies" rows={rows} columns={[
					{ key: "policyNumber", label: "Policy Number", required: true },
					{ key: "clientCompany", label: "Client Company", required: true },
					{ key: "effectiveDate", label: "Effective Date", format: "date", editor: "date", required: true },
					{ key: "insuranceCompanyId", label: "Insurance Company", editor: "select", required: true, options: insuranceCompanyOptions },
					{ key: "intermediaryId", label: "Intermediary", editor: "select", nullable: true, options: intermediaryOptions },
					{ key: "terminated", label: "Terminated", editor: "checkbox" },
					{ key: "terminationDate", label: "Termination Date", format: "date", editor: "date", nullable: true },
					{ key: "type", label: "Type", editor: "select", required: true, options: [
						{ value: "REV", label: "Revisable" }, { value: "FIX", label: "Fixed-rate" },
					] },
					{ key: "nominativeList", label: "Nominative List", nullable: true },
				]} onCreate={createInsurancePolicy} onUpdate={updateInsurancePolicy} onDelete={deleteInsurancePolicy} />
			</div>
		</section>
	);
}
