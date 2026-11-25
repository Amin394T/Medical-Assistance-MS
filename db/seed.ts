import { inArray } from "drizzle-orm";
import { db } from "./index";
import {
  billingInvoices,
  insuranceCommissions,
  insuranceCoverages,
  insurancePolicies,
  insuranceProviders,
  invoiceCollections,
  invoiceSettlements,
  medicalCertificates,
  medicalRecords,
  medicalServices,
  serviceProviders,
  serviceTypes,
} from "./schemas";

const now = new Date();
const at = (daysAgo: number, hour = 10) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date;
};

function getId(map: Map<string, number>, key: string, label: string) {
  const id = map.get(key);
  if (id === undefined) throw new Error(`Missing ${label}: ${key}`);
  return id;
}

function annualReference(date: Date, sequence: number, digits: number) {
  return Number(
    `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(sequence).padStart(digits, "0")}`,
  );
}

const counts = db.transaction((tx) => {
  tx.delete(medicalServices).run();
  tx.delete(medicalCertificates).run();
  tx.delete(billingInvoices).run();
  tx.delete(invoiceSettlements).run();
  tx.delete(invoiceCollections).run();
  tx.delete(medicalRecords).run();
  tx.delete(insuranceCoverages).run();
  tx.delete(insurancePolicies).run();
  tx.delete(insuranceCommissions).run();
  tx.delete(serviceProviders).run();
  tx.delete(serviceTypes).run();
  tx.delete(insuranceProviders).run();

  const providerIds = new Map(
    tx.insert(insuranceProviders).values([
      { label: "Atlas Mutual Assurance", phone: "+1 555 010 1100", email: "claims@atlas.example.test" },
      { label: "Northstar Coverage", phone: "+1 555 010 1200", email: "claims@northstar.example.test" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  tx.insert(insuranceCommissions).values([
    { providerId: getId(providerIds, "Atlas Mutual Assurance", "insurance provider"), recordType: "AT", commission: 25 },
    { providerId: getId(providerIds, "Northstar Coverage", "insurance provider"), recordType: "AT", commission: 30 },
  ]).run();

  const policyIds = new Map(
    tx.insert(insurancePolicies).values([
      { policyNumber: "AM-2026-00418", clientCompany: "Maple Works Manufacturing", clientActivity: "Manufacturing", clientAddress: "14 Maple Industrial Way", clientCity: "Springfield", type: "GLB", status: "VLD", statusDate: at(20), insuranceProviderId: getId(providerIds, "Atlas Mutual Assurance", "insurance provider"), uploadDate: at(20) },
      { policyNumber: "AM-2026-00972", clientCompany: "Brightline Construction", clientActivity: "Construction", clientAddress: "82 North Road", clientCity: "Riverton", type: "NMT", status: "VLD", statusDate: at(15), insuranceProviderId: getId(providerIds, "Atlas Mutual Assurance", "insurance provider"), uploadDate: at(15) },
      { policyNumber: "NS-2024-00136", clientCompany: "Riverside Food Logistics", clientActivity: "Food logistics", clientAddress: "2 River Park", clientCity: "Northport", type: "GLB", status: "TRM", statusDate: at(30), insuranceProviderId: getId(providerIds, "Northstar Coverage", "insurance provider"), uploadDate: at(400) },
      { policyNumber: "NS-2026-01005", clientCompany: "Juniper Electrical Services", clientActivity: "Electrical services", clientAddress: "37 Juniper Street", clientCity: "Lakeview", type: "GLB", status: "SPD", statusDate: at(3), insuranceProviderId: getId(providerIds, "Northstar Coverage", "insurance provider"), uploadDate: at(3) },
    ]).returning().all().map(({ id, policyNumber }) => [policyNumber, id]),
  );
  tx.insert(insuranceCoverages).values([
    { policyId: getId(policyIds, "AM-2026-00972", "insurance policy"), employee: "Ava Turner" },
    { policyId: getId(policyIds, "AM-2026-00972", "insurance policy"), employee: "Chloe Adams" },
  ]).run();

  const serviceTypeIds = new Map(
    tx.insert(serviceTypes).values([
      { label: "Emergency transport", paymentAmount: 450, billingAmount: 520, taxRate: 0, targetProfile: "AMBULANCE" },
      { label: "Emergency physician assessment", paymentAmount: 260, billingAmount: 300, taxRate: 0, targetProfile: "PHYSICIAN" },
      { label: "General medical consultation", paymentAmount: 180, billingAmount: 210, taxRate: 0, targetProfile: "PHYSICIAN" },
      { label: "Hospital admission", paymentAmount: 960, billingAmount: 1100, taxRate: 0, targetProfile: "HOSPITAL" },
      { label: "Medication dispensing", paymentAmount: 120, billingAmount: 140, taxRate: 0, targetProfile: "PHARMACY" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );
  const serviceProviderIds = new Map(
    tx.insert(serviceProviders).values([
      { label: "MetroCare Ambulance", profile: "AMBULANCE", contactName: "Lina Haddad", phone: "+1 555 020 1100", email: "dispatch@metrocare.example.test" },
      { label: "Dr. Samuel Reed", profile: "PHYSICIAN", contactName: "Samuel Reed", phone: "+1 555 020 1200", email: "s.reed@caremail.example.test" },
      { label: "St. Anne Medical Center", profile: "HOSPITAL", contactName: "Omar Youssef", phone: "+1 555 020 1400", email: "intake@stanne.example.test" },
      { label: "Green Cross Pharmacy", profile: "PHARMACY", contactName: "Nora James", phone: "+1 555 020 1500", email: "claims@greencross.example.test" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const recordSpecs = [
    { reference: 26112401, policy: "AM-2026-00418", accidentType: "AT" as const, accidentDate: at(1, 8), reportingDate: at(1, 9), reporterName: "Leah Morgan", reporterPhone: "+1 555 030 1001", accidentPlace: "WKS" as const, accidentCause: "EQP" as const, accidentEvolution: "INT" as const, victimFirstName: "Ethan", victimLastName: "Cole", victimPhone: "+1 555 030 2001", victimNationalId: "9001000001", victimJob: "Machine operator", status: "PRG" as const, manager: "Amin Hassan", observation: "Initial report received by phone." },
    { reference: 26112201, policy: "AM-2026-00972", accidentType: "AT" as const, accidentDate: at(3, 10), reportingDate: at(3, 11), reporterName: "Noah Bennett", reporterPhone: "+1 555 030 1002", accidentPlace: "CST" as const, accidentCause: "FAL" as const, accidentEvolution: "DTH" as const, victimFirstName: "Ava", victimLastName: "Turner", victimPhone: null, victimNationalId: "9001000002", victimJob: "Site supervisor", status: "DSP" as const, manager: "Nadia Karim", observation: "Policy decision is under dispute." },
    { reference: 26111901, policy: "NS-2024-00136", accidentType: "MD" as const, accidentDate: at(6, 7), reportingDate: at(6, 8), reporterName: "Rosa Diaz", reporterPhone: null, accidentPlace: "OFC" as const, accidentCause: "FTG" as const, accidentEvolution: "INT" as const, victimFirstName: "Lucas", victimLastName: "Perry", victimPhone: null, victimNationalId: null, victimJob: "Warehouse associate", status: "RJC" as const, statusReason: "TRM" as const, manager: "Amin Hassan", observation: "The policy was terminated before the reported event." },
  ];
  const recordIds = new Map(
    tx.insert(medicalRecords).values(recordSpecs.map(({ policy, ...record }) => ({
      ...record,
      policyId: getId(policyIds, policy, "insurance policy"),
      regulatoryDoctor: null,
      lastUpdated: now,
      lastUpdater: record.manager,
    }))).returning().all().map(({ id, reference }) => [String(reference), id]),
  );

  const services = tx.insert(medicalServices).values([
    { medicalRecordId: getId(recordIds, "26112401", "medical record"), serviceTypeId: getId(serviceTypeIds, "Emergency transport", "service type"), serviceProviderId: getId(serviceProviderIds, "MetroCare Ambulance", "service provider"), date: at(1, 15), place: "Accident site", observation: "Transported for evaluation.", paymentAmount: 450, billingAmount: 520, taxRate: 0 },
    { medicalRecordId: getId(recordIds, "26112401", "medical record"), serviceTypeId: getId(serviceTypeIds, "Emergency physician assessment", "service type"), serviceProviderId: getId(serviceProviderIds, "Dr. Samuel Reed", "service provider"), date: at(1, 16), place: "Clinic", observation: "Initial examination completed.", paymentAmount: 260, billingAmount: 300, taxRate: 0 },
    { medicalRecordId: getId(recordIds, "26112201", "medical record"), serviceTypeId: getId(serviceTypeIds, "Emergency physician assessment", "service type"), serviceProviderId: getId(serviceProviderIds, "Dr. Samuel Reed", "service provider"), date: at(3, 14), place: "Clinic", observation: "Review related to the disputed case.", paymentAmount: 260, billingAmount: 300, taxRate: 0 },
    { medicalRecordId: getId(recordIds, "26111901", "medical record"), serviceTypeId: getId(serviceTypeIds, "General medical consultation", "service type"), serviceProviderId: getId(serviceProviderIds, "Dr. Samuel Reed", "service provider"), date: at(6, 15), place: "Clinic", observation: "Service provided while policy review is pending.", paymentAmount: 180, billingAmount: 210, taxRate: 0 },
  ]).returning().all();

  const invoiceOneServices = services.filter((service) => service.medicalRecordId === getId(recordIds, "26112401", "medical record"));
  const disputedServices = services.filter((service) => service.medicalRecordId === getId(recordIds, "26112201", "medical record"));
  const issueDate = at(1);
  const invoiceRows = tx.insert(billingInvoices).values([
    { medicalRecordId: getId(recordIds, "26112401", "medical record"), reference: annualReference(issueDate, 1, 6), issueDate, totalAmount: 820 },
    { medicalRecordId: getId(recordIds, "26112201", "medical record"), reference: annualReference(issueDate, 2, 6), issueDate, totalAmount: 300 },
  ]).returning().all();
  const invoiceOne = invoiceRows[0];
  const disputedInvoice = invoiceRows[1];
  if (!invoiceOne || !disputedInvoice) throw new Error("Unable to seed invoices.");

  tx.update(medicalServices).set({ invoiceId: invoiceOne.id }).where(inArray(medicalServices.id, invoiceOneServices.map(({ id }) => id))).run();
  tx.update(medicalServices).set({ invoiceId: disputedInvoice.id }).where(inArray(medicalServices.id, disputedServices.map(({ id }) => id))).run();

  const collectionDate = at(1);
  const [collection] = tx.insert(invoiceCollections).values({
    reference: annualReference(collectionDate, 1, 4),
    insuranceProviderId: getId(providerIds, "Atlas Mutual Assurance", "insurance provider"),
    requestDate: collectionDate,
    totalAmount: invoiceOne.totalAmount,
    collected: false,
  }).returning().all();
  if (!collection) throw new Error("Unable to seed invoice collection.");
  tx.update(billingInvoices).set({ collectionId: collection.id }).where(inArray(billingInvoices.id, [invoiceOne.id])).run();

  const settlementDate = at(2);
  const [settlement] = tx.insert(invoiceSettlements).values({
    reference: annualReference(settlementDate, 1, 4),
    serviceProviderId: getId(serviceProviderIds, "Dr. Samuel Reed", "service provider"),
    receptionDate: settlementDate,
    totalAmount: 560,
    settled: false,
  }).returning().all();
  if (!settlement) throw new Error("Unable to seed invoice settlement.");
  tx.update(medicalServices).set({ settlementId: settlement.id }).where(inArray(medicalServices.id, [
    ...invoiceOneServices.map(({ id }) => id),
    ...disputedServices.map(({ id }) => id),
  ])).run();

  tx.insert(medicalCertificates).values([
    { medicalRecordId: getId(recordIds, "26112401", "medical record"), type: "INIT", serviceProviderId: getId(serviceProviderIds, "Dr. Samuel Reed", "service provider"), dayCount: 5, compensationRate: 100, startDate: at(1), endDate: at(-4), observation: "Awaiting provider signature." },
    { medicalRecordId: getId(recordIds, "26112201", "medical record"), type: "PROL", serviceProviderId: getId(serviceProviderIds, "Dr. Samuel Reed", "service provider"), dayCount: 3, compensationRate: 80, startDate: at(2), endDate: at(-1), observation: "Review completed." },
  ]).run();

  return {
    insuranceProviders: providerIds.size,
    insurancePolicies: policyIds.size,
    serviceTypes: serviceTypeIds.size,
    serviceProviders: serviceProviderIds.size,
    medicalRecords: recordIds.size,
    medicalServices: services.length,
    billingInvoices: invoiceRows.length,
    invoiceCollections: 1,
    invoiceSettlements: 1,
    medicalCertificates: 2,
  };
});

console.info("Mock data generated:");
for (const [table, count] of Object.entries(counts)) console.info(`  ${table}: ${count}`);
db.$client.close();
