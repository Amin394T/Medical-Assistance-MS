import { HandCoins } from "lucide-react";

import { listServiceProviders } from "@/db/actions/serviceProviders";
import { listServiceTypes } from "@/db/actions/serviceTypes";
import { createSettlementMedicalService, deleteMedicalService, listServicesForSettlement, updateSettlementMedicalService } from "@/db/actions/medicalServices";
import { createBillingInvoicesForServices } from "@/db/actions/billingInvoices";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";
import { formatMedicalRecordReference } from "@/app/_lib/medical-record-reference";
import { settlementStatusBadgeClasses } from "@/app/_lib/status-colors";
import { getGridListQuery } from "@/app/_lib/grid-list-query";

export const dynamic = "force-dynamic";

export default async function ServiceSettlementPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await getGridListQuery(searchParams, "date");
  const [list, providers, serviceTypes] = await Promise.all([
    listServicesForSettlement(query),
    listServiceProviders(),
    listServiceTypes(),
  ]);
  const providersByServiceType = Object.fromEntries(serviceTypes.map((serviceType) => [
    String(serviceType.id),
    providers.filter(({ profile }) => profile === serviceType.targetProfile).map(({ id, label }) => ({ value: id, label })),
  ]));
  const defaultServiceAmounts = [
    { fieldKey: "paymentAmount", values: Object.fromEntries(serviceTypes.map(({ id, paymentAmount }) => [String(id), paymentAmount])) },
    { fieldKey: "billingAmount", values: Object.fromEntries(serviceTypes.map(({ id, billingAmount }) => [String(id), billingAmount])) },
    { fieldKey: "taxRate", values: Object.fromEntries(serviceTypes.map(({ id, taxRate }) => [String(id), taxRate])) },
  ];

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Facturation" title="Règlement des Prestations" icon={<HandCoins className="h-6 w-6" />} />
        <ReferencialDataGrid
          key={JSON.stringify([list.search, list.sort, list.sortDesc])}
          title="Règlement des Prestations"
          rows={list.rows.map((row) => ({
            id: row.id,
            record: formatMedicalRecordReference(row.accidentType, row.recordReference),
            serviceProviderId: row.serviceProviderId,
            serviceTypeId: row.serviceTypeId,
            serviceProvider: row.serviceProvider,
            serviceType: row.serviceType,
            date: row.date,
            observation: row.observation,
            paymentAmount: row.paymentAmount,
            billingAmount: row.billingAmount,
            taxRate: row.taxRate,
            settlementStatus: row.settlementStatus,
            settlingDate: row.settlingDate,
            bank: row.bank ?? null,
            paymentMode: row.paymentMode ?? null,
            paymentReference: row.paymentReference ?? null,
            invoiceId: row.invoiceId ?? null,
            invoiceReference: row.invoiceReference,
          }))}
          columns={[
            { key: "record", label: "Dossier Médical", readOnly: true },
            { key: "invoiceReference", label: "Facture", readOnly: true },
            { key: "serviceTypeId", label: "Type de Prestation", editor: "select", required: true, options: serviceTypes.map(({ id, label }) => ({ value: id, label })), defaultFieldsByOption: defaultServiceAmounts },
            { key: "serviceProviderId", label: "Prestataire de Soins", editor: "select", required: true, optionsBy: { dependencyKey: "serviceTypeId", values: providersByServiceType } },
            { key: "date", label: "Date", editor: "date", format: "date", nullable: true },
            { key: "settlementStatus", label: "Statut du Règlement", readOnly: true, options: [
              { value: "WAIT", label: "En Attente" }, { value: "BILL", label: "Facturée" }, { value: "SETT", label: "Réglée" },
            ], badgeClasses: settlementStatusBadgeClasses },
            { key: "settlingDate", label: "Date de Règlement", format: "date", readOnly: true },
            { key: "paymentAmount", label: "Montant à Payer", editor: "number", required: true },
            { key: "billingAmount", label: "Montant à Facturer", editor: "number", required: true },
            { key: "taxRate", label: "Taux de Taxe", editor: "number", required: true },
            { key: "bank", label: "Banque", nullable: true },
            { key: "paymentMode", label: "Mode de Paiement", editor: "select", nullable: true, options: [
              { value: null, label: "Aucun" }, { value: "CHQ", label: "Chèque" }, { value: "VRM", label: "Virement" }, { value: "CSH", label: "Espèces" },
            ] },
            { key: "paymentReference", label: "Référence de Paiement", nullable: true },
            { key: "observation", label: "Observation", nullable: true },
          ]}
          onCreate={createSettlementMedicalService}
          onUpdate={updateSettlementMedicalService}
          onDelete={deleteMedicalService}
          canCreate={false}
          canDelete={false}
          initialSearch={list.search}
          serverPagination={{
            page: list.page,
            pageSize: list.pageSize,
            totalCount: list.totalCount,
            sort: list.sort,
            sortDesc: list.sortDesc,
            defaultSort: "date",
            defaultSortDesc: true,
          }}
          selection={{
            key: "settlementStatus",
            selectableValues: ["WAIT"],
            actionLabel: "Créer une Facture",
            onAction: createBillingInvoicesForServices,
          }}
        />
      </div>
    </section>
  );
}
