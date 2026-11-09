import { HandCoins } from "lucide-react";

import { listServiceProviders } from "@/db/actions/serviceProviders";
import { listServiceTypes } from "@/db/actions/serviceTypes";
import { createSettlementMedicalService, deleteMedicalService, listServicesForSettlement, updateSettlementMedicalService } from "@/db/actions/medicalServices";
import { createBillingInvoicesForServices } from "@/db/actions/billingInvoices";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function ServiceSettlementPage() {
  const [rows, providers, serviceTypes] = await Promise.all([
    listServicesForSettlement(),
    listServiceProviders(),
    listServiceTypes(),
  ]);
  const serviceTypesByProvider = Object.fromEntries(providers.map((provider) => [
    String(provider.id),
    serviceTypes.filter(({ targetProfile }) => targetProfile === provider.profile).map(({ id, label }) => ({ value: id, label })),
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
          title="Service Settlement"
          rows={rows.map((row) => ({
            id: row.id,
            record: `${row.accidentType}-${row.recordReference}`,
            clientCompany: row.clientCompany,
            insuranceProvider: row.insuranceProvider,
            victim: [row.victimFirstName, row.victimLastName].filter(Boolean).join(" "),
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
            { key: "clientCompany", label: "Client Company", readOnly: true },
            { key: "insuranceProvider", label: "Insurance Provider", readOnly: true },
            { key: "victim", label: "Victim", readOnly: true },
            { key: "serviceProviderId", label: "Service Provider", editor: "select", required: true, options: providers.map(({ id, label }) => ({ value: id, label })) },
            { key: "serviceTypeId", label: "Service Type", editor: "select", required: true, optionsBy: { dependencyKey: "serviceProviderId", values: serviceTypesByProvider }, defaultFieldsByOption: defaultServiceAmounts },
            { key: "date", label: "Date", editor: "date", format: "date", nullable: true },
            { key: "observation", label: "Observation", nullable: true },
            { key: "settlementStatus", label: "Settlement Status", readOnly: true, options: [
              { value: "WAIT", label: "Waiting" }, { value: "BILL", label: "Billed" }, { value: "SETT", label: "Settled" },
            ] },
            { key: "settlingDate", label: "Settling Date", format: "date", readOnly: true },
            { key: "paymentAmount", label: "Payment Amount", editor: "number", required: true },
            { key: "billingAmount", label: "Billing Amount", editor: "number", required: true },
            { key: "taxRate", label: "Tax Rate", editor: "number", required: true },
            { key: "bank", label: "Bank", nullable: true },
            { key: "paymentMode", label: "Payment Mode", editor: "select", nullable: true, options: [
              { value: null, label: "None" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" },
            ] },
            { key: "paymentReference", label: "Payment Reference", nullable: true },
            { key: "invoiceReference", label: "Invoice", readOnly: true },
          ]}
          onCreate={createSettlementMedicalService}
          onUpdate={updateSettlementMedicalService}
          onDelete={deleteMedicalService}
          canCreate={false}
          canDelete={false}
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
