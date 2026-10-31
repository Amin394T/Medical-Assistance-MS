import { createInsurancePolicy, deleteInsurancePolicy, listInsurancePolicies, updateInsurancePolicy } from "@/db/actions/insurancePolicies";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { createInsurancePolicyStatus, deleteInsurancePolicyStatus, listInsurancePolicyStatuses, updateInsurancePolicyStatus } from "@/db/actions/insurancePolicyStatuses";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { ShieldHalf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage() {
	const [policies, providers, statuses] = await Promise.all([listInsurancePolicies(), listInsuranceProviders(), listInsurancePolicyStatuses()]);
	const rows = policies.map(({ id, policyNumber, clientCompany, effectiveDate, insuranceCompanyId, intermediaryId, type, creationDate, lastModified }) => ({
		id,
		policyNumber,
		clientCompany,
		effectiveDate,
		insuranceCompanyId,
		intermediaryId,
		type,
		creationDate,
		lastModified,
	}));
	const insuranceCompanyOptions = providers.filter((provider) => provider.type === "CMP").map((provider) => ({ value: provider.id, label: provider.label }));
	const intermediaryOptions = [
		{ value: null, label: "None" },
		...providers.filter((provider) => provider.type === "AGT" || provider.type === "BRK").map((provider) => ({ value: provider.id, label: provider.label })),
	];
	const policyOptions = policies.map(({ id, policyNumber, clientCompany }) => ({ value: id, label: `${policyNumber} - ${clientCompany}` }));

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375 space-y-8">
				<PageHeader section="Insurance" title="Client Policies" icon={<ShieldHalf className="h-6 w-6" />} />
				<ReferencialDataGrid title="Client Policies" rows={rows} columns={[
					{ key: "policyNumber", label: "Policy Number", required: true },
					{ key: "clientCompany", label: "Client Company", required: true },
					{ key: "effectiveDate", label: "Effective Date", format: "date", editor: "date", required: true },
					{ key: "insuranceCompanyId", label: "Insurance Company", editor: "select", required: true, options: insuranceCompanyOptions },
					{ key: "intermediaryId", label: "Intermediary", editor: "select", nullable: true, options: intermediaryOptions },
					{ key: "type", label: "Type", editor: "select", required: true, options: [
						{ value: "REV", label: "Revisable" }, { value: "FIX", label: "Fixed-rate" },
					] },
					{ key: "creationDate", label: "Creation Date", format: "datetime", readOnly: true },
					{ key: "lastModified", label: "Last Modified", format: "datetime", readOnly: true },
				]} onCreate={createInsurancePolicy} onUpdate={updateInsurancePolicy} onDelete={deleteInsurancePolicy} />
				<ReferencialDataGrid title="Policy Status History" rows={statuses.map(({ id, policyId, status, effectiveDate, updateDate, cancelled }) => ({
					id, policyId, status, effectiveDate, updateDate, cancelled: Boolean(cancelled),
				}))} columns={[
					{ key: "policyId", label: "Policy", editor: "select", required: true, options: policyOptions },
					{ key: "status", label: "Status", editor: "select", required: true, options: [
						{ value: "VALID", label: "Valid" },
						{ value: "SSPD", label: "Suspended" }, { value: "TRMN", label: "Terminated" },
					] },
					{ key: "effectiveDate", label: "Effective Date", format: "date", editor: "date", required: true },
					{ key: "updateDate", label: "Update Date", format: "date", readOnly: true },
					{ key: "cancelled", label: "Cancelled", editor: "checkbox" },
				]} onCreate={createInsurancePolicyStatus} onUpdate={updateInsurancePolicyStatus} onDelete={deleteInsurancePolicyStatus} />
			</div>
		</section>
	);
}
