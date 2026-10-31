import { HandCoins } from "lucide-react";

import { listServiceProviders } from "@/db/actions/serviceProviders";
import { listServiceTypes } from "@/db/actions/serviceTypes";
import { createSettlementMedicalService, deleteMedicalService, listServicesForSettlement, updateSettlementMedicalService } from "@/db/actions/medicalServices";
import { listMedicalRecords } from "@/db/actions/medicalRecords";
import { listInvoices } from "@/db/actions/invoices";
import { ReferencialDataGrid } from "@/app/_components/referential-data-grid";
import { PageHeader } from "@/app/_components/page-header";

export const dynamic = "force-dynamic";

export default async function ServiceSettlementPage() {
  const [rows, providers, serviceTypes, records, invoices] = await Promise.all([
    listServicesForSettlement(),
    listServiceProviders(),
    listServiceTypes(),
    listMedicalRecords(),
    listInvoices(),
  ]);
  const serviceTypesByProvider = Object.fromEntries(providers.map((provider) => [
    String(provider.id),
    serviceTypes.filter(({ targetProfile }) => targetProfile === provider.profile).map(({ id, label }) => ({ value: id, label })),
  ]));
  const defaultPayments = Object.fromEntries(serviceTypes.map(({ id, paymentAmount }) => [String(id), paymentAmount]));

  return (
    <section className="min-h-screen bg-[#f7f8fa] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-375">
        <PageHeader section="Billing" title="Service Settlement" icon={<HandCoins className="h-6 w-6" />} />
        <ReferencialDataGrid
          title="Service Settlement"
          rows={rows.map((row) => ({
            id: row.id,
            medicalRecordId: row.medicalRecordId,
            serviceProviderId: row.serviceProviderId,
            serviceTypeId: row.serviceTypeId,
            date: row.date,
            paymentAmount: row.paymentAmount,
            billingAmount: row.billingAmount,
            taxRate: row.taxRate,
            settlementStatus: row.settlementStatus,
            settlingDate: row.settlingDate,
            bank: row.bank ?? null,
            paymentMode: row.paymentMode ?? null,
            paymentReference: row.paymentReference ?? null,
            invoiceId: row.invoiceId ?? null,
            observation: row.observation ?? null,
          }))}
          columns={[
            { key: "medicalRecordId", label: "Medical Record", editor: "select", required: true, options: records.map(({ id, reference, victimName }) => ({ value: id, label: `${reference} - ${victimName}` })) },
            { key: "serviceProviderId", label: "Provider", editor: "select", required: true, options: providers.map(({ id, label }) => ({ value: id, label })) },
            { key: "serviceTypeId", label: "Service Type", editor: "select", required: true, optionsBy: { dependencyKey: "serviceProviderId", values: serviceTypesByProvider }, defaultFieldByOption: { fieldKey: "paymentAmount", values: defaultPayments } },
            { key: "date", label: "Service Date", editor: "date", format: "date", nullable: true },
            { key: "paymentAmount", label: "Payment Amount", editor: "number" },
            { key: "billingAmount", label: "Billing Amount", editor: "number" },
            { key: "taxRate", label: "Tax Rate", editor: "number" },
            { key: "settlementStatus", label: "Settlement Status", editor: "select", required: true, options: [
              { value: "WAIT", label: "Waiting" }, { value: "BILL", label: "Billed" }, { value: "SETT", label: "Settled" },
            ] },
            { key: "settlingDate", label: "Settling Date", editor: "date", format: "date", nullable: true },
            { key: "paymentMode", label: "Payment Mode", editor: "select", nullable: true, options: [
              { value: null, label: "None" }, { value: "CHQ", label: "Check" }, { value: "VRM", label: "Transfer" }, { value: "CSH", label: "Cash" },
            ] },
            { key: "paymentReference", label: "Payment Reference", nullable: true },
            { key: "invoiceId", label: "Invoice", editor: "select", nullable: true, options: [
              { value: null, label: "None" },
              ...invoices.map(({ id, reference, insuranceProvider }) => ({ value: id, label: `${reference} - ${insuranceProvider}` })),
            ] },
            { key: "observation", label: "Observation", nullable: true },
          ]}
          onCreate={createSettlementMedicalService}
          onUpdate={updateSettlementMedicalService}
          onDelete={deleteMedicalService}
        />
      </div>
    </section>
  );
}
