import { listInsurancePoliciesPage, listInsurancePolicyEmployees } from "@/db/actions/insurancePolicies";
import { listInsuranceProviders } from "@/db/actions/insuranceProviders";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { getGridListQuery } from "@/app/_lib/grid-list-query";
import { ShieldHalf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsurancePoliciesPage({ searchParams }: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const query = await getGridListQuery(searchParams, "creationDate");
	const [list, providers] = await Promise.all([listInsurancePoliciesPage(query), listInsuranceProviders()]);
	const rows = list.rows.map(({ id, policyNumber, clientCompany, clientActivity, clientAddress, clientCity, type, effectiveDate, status, insuranceCompanyId, creationDate, lastUpdated }) => ({
		id,
		policyNumber,
		clientCompany,
		clientActivity,
		clientAddress,
		clientCity,
		type,
		effectiveDate,
		status,
		insuranceCompanyId,
		creationDate,
		lastUpdated,
	}));
	const insuranceCompanyOptions = providers.map((provider) => ({ value: provider.id, label: provider.label }));

	return (
		<section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
			<div className="mx-auto max-w-375 space-y-8">
				<PageHeader section="Assurance" title="Polices des Clients" icon={<ShieldHalf className="h-6 w-6" />} />
				<ReferencialDataGrid
					key={JSON.stringify([list.search, list.sort, list.sortDesc])}
					title="Polices des Clients"
					rows={rows}
					loadDialogItems={listInsurancePolicyEmployees}
					columns={[
						{ key: "policyNumber", label: "Numéro de Police", required: true, readOnly: true },
						{ key: "clientCompany", label: "Entreprise Cliente", required: true, readOnly: true },
						{ key: "clientActivity", label: "Activité du Client", readOnly: true },
						{ key: "clientAddress", label: "Adresse du Client", readOnly: true },
						{ key: "clientCity", label: "Ville du Client", readOnly: true },
						{ key: "type", label: "Type de Police", readOnly: true, options: [
							{ value: "REV", label: "Révisable" }, { value: "FIX", label: "Forfaitaire" },
						], dialogTitle: "Employés Couverts", dialogValues: ["FIX"] },
						{ key: "effectiveDate", label: "Date d’Effet", format: "date", readOnly: true },
						{ key: "status", label: "Statut", readOnly: true, options: [
							{ value: "VALI", label: "Valide" },
							{ value: "SUSP", label: "Suspendue" },
							{ value: "TERM", label: "Résiliée" },
						], badgeClasses: {
							VALI: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
							SUSP: "bg-amber-50 text-amber-700 ring-amber-600/20",
							TERM: "bg-rose-50 text-rose-700 ring-rose-600/20",
						} },
						{ key: "insuranceCompanyId", label: "Compagnie d’Assurance", readOnly: true, options: insuranceCompanyOptions },
						{ key: "creationDate", label: "Date de Création", format: "datetime", readOnly: true },
						{ key: "lastUpdated", label: "Dernière Modification", format: "datetime", readOnly: true },
					]}
					readOnly
					initialSearch={list.search}
					serverPagination={{
						page: list.page,
						pageSize: list.pageSize,
						totalCount: list.totalCount,
						sort: list.sort,
						sortDesc: list.sortDesc,
						defaultSort: "creationDate",
						defaultSortDesc: true,
					}}
				/>
			</div>
		</section>
	);
}
