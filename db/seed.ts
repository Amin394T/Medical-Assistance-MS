import { eq, inArray } from "drizzle-orm";

import { db } from "./index";
import {
  billingCashings,
  billingInvoices,
  insurancePolicies,
  insurancePolicyEmployees,
  insuranceProviders,
  medicalCertificates,
  medicalRecords,
  medicalServices,
  serviceProviders,
  serviceTypes,
} from "./schemas";

const now = new Date();

function dateOffset(days: number, hour = 10) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function getId(map: Map<string, number>, key: string, label: string) {
  const id = map.get(key);
  if (id === undefined) throw new Error(`Missing ${label}: ${key}`);
  return id;
}

function recordReference(date: Date, sequence = 1) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return Number(`${year}${month}${day}${String(sequence).padStart(2, "0")}`);
}

function billingReference(date: Date, sequence: number) {
  const yearMonth = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return Number(`${yearMonth}${String(sequence).padStart(6, "0")}`);
}

const counts = db.transaction((tx) => {
  tx.delete(medicalServices).run();
  tx.delete(medicalCertificates).run();
  tx.delete(billingInvoices).run();
  tx.delete(billingCashings).run();
  tx.delete(medicalRecords).run();
  tx.delete(insurancePolicyEmployees).run();
  tx.delete(insurancePolicies).run();
  tx.delete(serviceProviders).run();
  tx.delete(serviceTypes).run();
  tx.delete(insuranceProviders).run();

  const insuranceProviderIds = new Map(
    tx.insert(insuranceProviders).values([
      { label: "Atlas Mutual Assurance", corporateId: "CMP-1001", type: "CMP", phone: "+1 555 010 1100", email: "claims@atlas.example.test", balance: 0 },
      { label: "Northstar Coverage", corporateId: "CMP-1002", type: "CMP", phone: "+1 555 010 1200", email: "claims@northstar.example.test", balance: 0 },
      { label: "Cedar Lane Brokers", corporateId: "BRK-2001", type: "BRK", phone: "+1 555 010 2100", email: "service@cedarlane.example.test", balance: 0 },
      { label: "Harbor Insurance Agency", corporateId: "AGT-3001", type: "AGT", phone: "+1 555 010 3100", email: "policies@harboragency.example.test", balance: 0 },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const policyIds = new Map(
    tx.insert(insurancePolicies).values([
      { policyNumber: "AM-2026-00418", clientCompany: "Maple Works Manufacturing", clientActivity: "Manufacturing", clientAddress: "14 Maple Industrial Way", clientCity: "Springfield", type: "REV" as const, effectiveDate: dateOffset(420), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Atlas Mutual Assurance", "insurance provider"), intermediaryId: getId(insuranceProviderIds, "Cedar Lane Brokers", "insurance provider"), creationDate: dateOffset(420), lastUpdated: now },
      { policyNumber: "AM-2026-00972", clientCompany: "Brightline Construction", clientActivity: "Construction", clientAddress: "82 North Road", clientCity: "Riverton", type: "FIX" as const, effectiveDate: dateOffset(260), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Atlas Mutual Assurance", "insurance provider"), intermediaryId: getId(insuranceProviderIds, "Harbor Insurance Agency", "insurance provider"), creationDate: dateOffset(260), lastUpdated: now },
      { policyNumber: "NS-2024-00136", clientCompany: "Riverside Food Logistics", clientActivity: "Food logistics", clientAddress: "2 River Park", clientCity: "Northport", type: "REV" as const, effectiveDate: dateOffset(700), status: "TERM" as const, insuranceCompanyId: getId(insuranceProviderIds, "Northstar Coverage", "insurance provider"), intermediaryId: null, creationDate: dateOffset(700), lastUpdated: dateOffset(30) },
      { policyNumber: "NS-2026-01005", clientCompany: "Juniper Electrical Services", clientActivity: "Electrical services", clientAddress: "37 Juniper Street", clientCity: "Lakeview", type: "FIX" as const, effectiveDate: dateOffset(-30), status: "SUSP" as const, insuranceCompanyId: getId(insuranceProviderIds, "Northstar Coverage", "insurance provider"), intermediaryId: getId(insuranceProviderIds, "Cedar Lane Brokers", "insurance provider"), creationDate: now, lastUpdated: now },
      { policyNumber: "AM-2026-01550", clientCompany: "Stonebridge Distribution", clientActivity: "Distribution", clientAddress: "9 Stonebridge Avenue", clientCity: "Fairview", type: "FIX" as const, effectiveDate: dateOffset(180), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Atlas Mutual Assurance", "insurance provider"), intermediaryId: null, creationDate: dateOffset(180), lastUpdated: now },
    ]).returning().all().map(({ id, policyNumber }) => [policyNumber, id]),
  );

  tx.insert(insurancePolicyEmployees).values([
    { policyId: getId(policyIds, "AM-2026-00972", "insurance policy"), employee: "9001000002" },
    { policyId: getId(policyIds, "AM-2026-01550", "insurance policy"), employee: "9001000010" },
    { policyId: getId(policyIds, "NS-2026-01005", "insurance policy"), employee: "9001000011" },
  ]).run();

  const serviceTypeIds = new Map(
    tx.insert(serviceTypes).values([
      { label: "Emergency transport", paymentAmount: 450, billingAmount: 450, taxRate: 0, targetProfile: "AMBULANCE" },
      { label: "Emergency physician assessment", paymentAmount: 260, billingAmount: 260, taxRate: 0, targetProfile: "EMERGENCY_PHYSICIAN" },
      { label: "General medical consultation", paymentAmount: 180, billingAmount: 180, taxRate: 0, targetProfile: "GENERAL_PRACTITIONER" },
      { label: "Hospital admission", paymentAmount: 960, billingAmount: 960, taxRate: 0, targetProfile: "HOSPITAL" },
      { label: "Medication dispensing", paymentAmount: 120, billingAmount: 120, taxRate: 0, targetProfile: "PHARMACY" },
      { label: "Regulatory review", paymentAmount: 150, billingAmount: 150, taxRate: 0, targetProfile: "REGULATOR" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const serviceProviderIds = new Map(
    tx.insert(serviceProviders).values([
      { label: "MetroCare Ambulance", corporateName: "MetroCare Response", profile: "AMBULANCE", contactName: "Lina Haddad", phone: "+1 555 020 1100", email: "dispatch@metrocare.example.test", bank: "BNA", bankAccount: "010-1100-1" },
      { label: "Dr. Samuel Reed", corporateName: null, profile: "EMERGENCY_PHYSICIAN", contactName: "Samuel Reed", phone: "+1 555 020 1200", email: "s.reed@caremail.example.test", bank: "BNA", bankAccount: "010-1200-2" },
      { label: "Dr. Maya Patel", corporateName: null, profile: "GENERAL_PRACTITIONER", contactName: "Maya Patel", phone: "+1 555 020 1300", email: "m.patel@caremail.example.test", bank: "BNA", bankAccount: "010-1300-3" },
      { label: "St. Anne Medical Center", corporateName: "St. Anne Health Network", profile: "HOSPITAL", contactName: "Omar Youssef", phone: "+1 555 020 1400", email: "intake@stanne.example.test", bank: "BNA", bankAccount: "010-1400-4" },
      { label: "Green Cross Pharmacy", corporateName: "Green Cross Health", profile: "PHARMACY", contactName: "Nora James", phone: "+1 555 020 1500", email: "claims@greencross.example.test", bank: "BNA", bankAccount: "010-1500-5" },
      { label: "Regional Work Safety Office", corporateName: "Regional Work Safety Office", profile: "REGULATOR", contactName: "Elena Brooks", phone: "+1 555 020 1600", email: "review@worksafety.example.test", bank: "BNA", bankAccount: "010-1600-6" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const recordSpecs = [
    {
      reference: recordReference(dateOffset(1, 8)), accidentType: "AT" as const, policyNumber: "AM-2026-00418", reportingDate: dateOffset(1, 9),
      reporterName: "Leah Morgan", reporterPhone: "+1 555 030 1001", accidentPlace: "WS" as const, accidentDate: dateOffset(1, 8), accidentCause: "EQIP" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Ethan", victimLastName: "Cole", victimPhone: "+1 555 030 2001", victimNationalId: "9001000001",
      victimJob: "Machine operator", status: "PRG" as const, delegationDate: null, regulatoryDoctor: null, manager: "Amin Hassan",
      observation: "Initial report received by phone.",
    },
    {
      reference: recordReference(dateOffset(3, 10)), accidentType: "AT" as const, policyNumber: "AM-2026-00972", reportingDate: dateOffset(3, 11),
      reporterName: "Noah Bennett", reporterPhone: "+1 555 030 1002", accidentPlace: "CT" as const, accidentDate: dateOffset(3, 10), accidentCause: "FALL" as const,
      accidentEvolution: "DEAT" as const, victimFirstName: "Ava", victimLastName: "Turner", victimPhone: null, victimNationalId: "9001000002",
      victimJob: "Site supervisor", status: "DSP" as const, delegationDate: dateOffset(3, 12), regulatoryDoctor: "Dr. Lin", manager: "Nadia Karim",
      observation: "Policy decision is under dispute.",
    },
    {
      reference: recordReference(dateOffset(6, 7)), accidentType: "MD" as const, policyNumber: "NS-2024-00136", reportingDate: dateOffset(6, 8),
      reporterName: "Rosa Diaz", reporterPhone: "+1 555 030 1003", accidentPlace: "OF" as const, accidentDate: dateOffset(6, 7), accidentCause: "FATG" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Lucas", victimLastName: "Perry", victimPhone: "+1 555 030 2003", victimNationalId: "9001000003",
      victimJob: "Warehouse associate", status: "RJC" as const, statusReason: "TER" as const, delegationDate: null, regulatoryDoctor: null, manager: "Amin Hassan",
      observation: "The policy was terminated before the reported event.",
    },
    {
      reference: recordReference(dateOffset(2, 12)), accidentType: "VF" as const, policyNumber: "AM-2026-00418", reportingDate: dateOffset(2, 13),
      reporterName: "Grace Kim", reporterPhone: "+1 555 030 1004", accidentPlace: "OF" as const, accidentDate: dateOffset(2, 12), accidentCause: null,
      accidentEvolution: "INIT" as const, victimFirstName: "Oliver", victimLastName: "Price", victimPhone: null, victimNationalId: "9001000004",
      victimJob: null, status: "CLS" as const, delegationDate: null, regulatoryDoctor: null, manager: "Nadia Karim",
      observation: "Policy validity confirmed with insurer.",
    },
    {
      reference: recordReference(dateOffset(20, 13)), accidentType: "AT" as const, policyNumber: "AM-2026-01550", reportingDate: dateOffset(20, 14),
      reporterName: "Mason Bell", reporterPhone: "+1 555 030 1005", accidentPlace: "WS" as const, accidentDate: dateOffset(20, 13), accidentCause: "VIOL" as const,
      accidentEvolution: "RELP" as const, victimFirstName: "Chloe", victimLastName: "Adams", victimPhone: null, victimNationalId: "9001000005",
      victimJob: "Inventory clerk", status: "ABN" as const, delegationDate: null, regulatoryDoctor: null, manager: "Amin Hassan",
      observation: "Record abandoned after caller follow-up.",
    },
  ];

  const recordIds = new Map(
    tx.insert(medicalRecords).values(recordSpecs.map(({ policyNumber, ...record }) => ({
      ...record,
      policyId: getId(policyIds, policyNumber, "insurance policy"),
      lastUpdated: now,
      lastUpdater: record.manager,
    }))).returning().all().map(({ id, reference }) => [String(reference), id]),
  );

  const serviceSeed = [
    { record: recordSpecs[0]!, type: "Emergency transport", provider: "MetroCare Ambulance", date: dateOffset(1, 15), observation: "Transported for evaluation.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[0]!, type: "Emergency physician assessment", provider: "Dr. Samuel Reed", date: dateOffset(1, 16), observation: "Initial examination completed.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[0]!, type: "Hospital admission", provider: "St. Anne Medical Center", date: dateOffset(1, 18), observation: "Observation and imaging.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[1]!, type: "Emergency physician assessment", provider: "Dr. Samuel Reed", date: dateOffset(3, 14), observation: "Review related to the disputed case.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[2]!, type: "General medical consultation", provider: "Dr. Maya Patel", date: dateOffset(6, 15), observation: "Service provided while policy review is pending.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[3]!, type: "Regulatory review", provider: "Regional Work Safety Office", date: dateOffset(2, 15), observation: "Eligibility checked.", settlementStatus: "SETT" as const },
    { record: recordSpecs[4]!, type: "Medication dispensing", provider: "Green Cross Pharmacy", date: dateOffset(20, 15), observation: "Prescription fulfilled.", settlementStatus: "WAIT" as const },
  ];

  const amounts = new Map([
    ["Emergency transport", 450],
    ["Emergency physician assessment", 260],
    ["General medical consultation", 180],
    ["Hospital admission", 960],
    ["Medication dispensing", 120],
    ["Regulatory review", 150],
  ]);
  const serviceRows = serviceSeed.map((service) => {
    const amount = amounts.get(service.type);
    if (amount === undefined) throw new Error(`Missing service amount: ${service.type}`);
    return {
      medicalRecordId: getId(recordIds, String(service.record.reference), "medical record"),
      serviceProviderId: getId(serviceProviderIds, service.provider, "service provider"),
      serviceTypeId: getId(serviceTypeIds, service.type, "service type"),
      date: service.date,
      observation: service.observation,
      settlementStatus: service.settlementStatus,
      settlingDate: service.settlementStatus === "SETT" ? dateOffset(1) : null,
      invoiceId: null,
      paymentAmount: amount,
      billingAmount: amount,
      taxRate: 0,
      bank: "BNA",
      paymentMode: service.settlementStatus === "SETT" ? "VRM" as const : null,
      paymentReference: service.settlementStatus === "SETT" ? "PAY-001" : null,
    };
  });
  const createdServices = tx.insert(medicalServices).values(serviceRows).returning().all();

  const invoiceOneServices = createdServices
    .filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[0]!.reference), "medical record"))
    .slice(0, 2);
  const invoiceTwoServices = createdServices.filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[1]!.reference), "medical record"));
  const invoiceDateOne = dateOffset(8);
  const invoiceDateTwo = dateOffset(5);
  const invoiceRows = [
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[0]!.reference), "medical record"),
      reference: billingReference(invoiceDateOne, 1),
      issueDate: invoiceDateOne,
      totalAmount: invoiceOneServices.reduce((total, service) => total + service.billingAmount, 0),
    },
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[1]!.reference), "medical record"),
      reference: billingReference(invoiceDateTwo, 2),
      issueDate: invoiceDateTwo,
      totalAmount: invoiceTwoServices.reduce((total, service) => total + service.billingAmount, 0),
    },
  ];
  const createdInvoices = tx.insert(billingInvoices).values(invoiceRows).returning().all();
  const invoiceOne = createdInvoices[0];
  const invoiceTwo = createdInvoices[1];
  if (!invoiceOne || !invoiceTwo) throw new Error("Unable to seed billing invoices.");

  tx.update(medicalServices)
    .set({ invoiceId: invoiceOne.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceOneServices.map(({ id }) => id)))
    .run();
  tx.update(medicalServices)
    .set({ invoiceId: invoiceTwo.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceTwoServices.map(({ id }) => id)))
    .run();

  const cashingRows = tx.insert(billingCashings).values([
    {
      insuranceProviderId: getId(insuranceProviderIds, "Atlas Mutual Assurance", "insurance provider"),
      requestDate: dateOffset(4),
      totalAmount: invoiceOne.totalAmount,
      bank: "BNA",
      paymentMode: "VRM",
      paymentReference: "CASH-AT-001",
      cashed: true,
      cashingDate: dateOffset(2),
    },
    {
      insuranceProviderId: getId(insuranceProviderIds, "Atlas Mutual Assurance", "insurance provider"),
      requestDate: dateOffset(3),
      totalAmount: invoiceTwo.totalAmount,
      bank: "BNA",
      paymentMode: "CHQ",
      paymentReference: "CASH-AT-002",
      cashed: false,
      cashingDate: null,
    },
  ]).returning().all();
  const firstCashing = cashingRows[0];
  const secondCashing = cashingRows[1];
  if (!firstCashing || !secondCashing) throw new Error("Unable to seed billing cashings.");

  tx.update(billingInvoices).set({ cashingId: firstCashing.id }).where(eq(billingInvoices.id, invoiceOne.id)).run();
  tx.update(billingInvoices).set({ cashingId: secondCashing.id }).where(eq(billingInvoices.id, invoiceTwo.id)).run();

  const certificateRows = [
    { record: recordSpecs[0]!, type: "INIT" as const, provider: "Dr. Samuel Reed", dayCount: 5, daysAgo: 1, observation: "Awaiting provider signature." },
    { record: recordSpecs[1]!, type: "INSP" as const, provider: "Dr. Samuel Reed", dayCount: 3, daysAgo: 2, observation: "Review completed." },
    { record: recordSpecs[2]!, type: "INIT" as const, provider: "Dr. Maya Patel", dayCount: 2, daysAgo: 5, observation: "Coverage decision pending." },
    { record: recordSpecs[4]!, type: "PROL" as const, provider: "Green Cross Pharmacy", dayCount: 7, daysAgo: 9, observation: "Follow-up certificate." },
  ];
  tx.insert(medicalCertificates).values(certificateRows.map((certificate) => ({
    medicalRecordId: getId(recordIds, String(certificate.record.reference), "medical record"),
    type: certificate.type,
    serviceProviderId: getId(serviceProviderIds, certificate.provider, "service provider"),
    dayCount: certificate.dayCount,
    startDate: dateOffset(certificate.daysAgo),
    endDate: dateOffset(certificate.daysAgo - certificate.dayCount),
    observation: certificate.observation,
  }))).run();

  return {
    insuranceProviders: insuranceProviderIds.size,
    insurancePolicies: policyIds.size,
    serviceTypes: serviceTypeIds.size,
    serviceProviders: serviceProviderIds.size,
    medicalRecords: recordIds.size,
    medicalServices: createdServices.length,
    medicalCertificates: certificateRows.length,
    billingInvoices: createdInvoices.length,
    billingCashings: cashingRows.length,
  };
});

console.info("Mock data generated:");
for (const [table, count] of Object.entries(counts)) console.info(`  ${table}: ${count}`);
db.$client.close();
