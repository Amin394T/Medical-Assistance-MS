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
        <PageHeader section="Billing" title="Service Settlement" icon={<HandCoins className="h-6 w-6" />} />
        <ReferencialDataGrid
          key={JSON.stringify([list.search, list.sort, list.sortDesc])}
          title="Service Settlement"
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
            { key: "record", label: "Medical Record", readOnly: true },
            { key: "invoiceReference", label: "Invoice", readOnly: true },
            { key: "serviceTypeId", label: "Service Type", editor: "select", required: true, options: serviceTypes.map(({ id, label }) => ({ value: id, label })), defaultFieldsByOption: defaultServiceAmounts },
            { key: "serviceProviderId", label: "Service Provider", editor: "select", required: true, optionsBy: { dependencyKey: "serviceTypeId", values: providersByServiceType } },
            { key: "date", label: "Date", editor: "date", format: "date", nullable: true },
            { key: "settlementStatus", label: "Settlement Status", readOnly: true, options: [
              { value: "WAIT", label: "Waiting" }, { value: "BILL", label: "Billed" }, { value: "SETT", label: "Settled" },
            ], badgeClasses: settlementStatusBadgeClasses },
            { key: "settlingDate", label: "Settling Date", format: "date", readOnly: true },
            { key: "paymentAmount", label: "Payment Amount", editor: "number", required: true },
            { key: "billingAmount", label: "Billing Amount", editor: "number", required: true },
            { key: "taxRate", label: "Tax Rate", editor: "number", required: true },
            { key: "bank", label: "Bank", nullable: true },
            { key: "paymentMode", label: "Payment Mode", editor: "select", nullable: true, options: [
              { value: null, label: "None" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" },
            ] },
            { key: "paymentReference", label: "Payment Reference", nullable: true },
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
            actionLabel: "Create Invoice",
            onAction: createBillingInvoicesForServices,
          }}
        />
      </div>
    </section>
  );
}
