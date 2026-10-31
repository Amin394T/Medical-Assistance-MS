import { db } from "./index";
import {
  insurancePolicies,
  insuranceProviders,
  invoices,
  medicalCertificates,
  medicalRecords,
  medicalServices,
  serviceProviders,
  serviceTypes,
} from "./schemas";
import type { NewMedicalRecord } from "./schemas";

type SeedMedicalRecord = NewMedicalRecord & {
  reference: number;
  status: "PRG" | "RJC" | "CLS" | "ABN";
  delegationDate: Date | null;
  regulatoryDoctor: string | null;
  manager: string;
  lastUpdated: Date;
  lastUpdater: string;
  observation: string | null;
};

type InvoiceSeedRow = {
  reference: number;
  date: Date;
  totalAmount: number;
  insuranceProviderId: number;
  bank: string | null;
  paymentMode: "CHQ" | "VRM" | "CSH" | null;
  paymentReference: string | null;
  cashed: boolean;
  cashingDate: Date | null;
};

type ServiceSeedRow = {
  record: SeedMedicalRecord;
  type: string;
  provider: string;
  date: Date;
  paymentAmount: number;
  billingAmount: number;
  taxRate: number;
  settlementStatus: "WAIT" | "BILL" | "SETT";
  settlingDate: Date | null;
  bank: string | null;
  paymentMode: "CHQ" | "VRM" | "CSH" | null;
  paymentReference: string | null;
  invoiceId: number | null;
  observation: string;
};

const now = new Date();

function dateOffset(days: number, hour = 10) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function reference(accidentDate: Date, sequence = 1) {
  const year = String(accidentDate.getFullYear()).slice(-2);
  const month = String(accidentDate.getMonth() + 1).padStart(2, "0");
  const day = String(accidentDate.getDate()).padStart(2, "0");
  return Number(`${year}${month}${day}${String(sequence).padStart(2, "0")}`);
}

function invoiceReference(date: Date, sequence: number) {
  const yearMonth = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return Number(`${yearMonth}${String(sequence).padStart(6, "0")}`);
}

const seededCounts = db.transaction((tx) => {
  tx.delete(medicalCertificates).run();
  tx.delete(medicalServices).run();
  tx.delete(invoices).run();
  tx.delete(medicalRecords).run();
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
      { policyNumber: "AM-2026-00418", clientCompany: "Maple Works Manufacturing", effectiveDate: dateOffset(420), status: "VALI", insuranceCompanyId: insuranceProviderIds.get("Atlas Mutual Assurance")!, intermediaryId: insuranceProviderIds.get("Cedar Lane Brokers")!, creationDate: dateOffset(420), lastUpdated: now },
      { policyNumber: "AM-2026-00972", clientCompany: "Brightline Construction", effectiveDate: dateOffset(260), status: "RESU", insuranceCompanyId: insuranceProviderIds.get("Atlas Mutual Assurance")!, intermediaryId: insuranceProviderIds.get("Harbor Insurance Agency")!, creationDate: dateOffset(260), lastUpdated: now },
      { policyNumber: "NS-2024-00136", clientCompany: "Riverside Food Logistics", effectiveDate: dateOffset(700), status: "TERM", insuranceCompanyId: insuranceProviderIds.get("Northstar Coverage")!, intermediaryId: null, creationDate: dateOffset(700), lastUpdated: dateOffset(30) },
      { policyNumber: "NS-2026-01005", clientCompany: "Juniper Electrical Services", effectiveDate: dateOffset(-30), status: "SUSP", insuranceCompanyId: insuranceProviderIds.get("Northstar Coverage")!, intermediaryId: insuranceProviderIds.get("Cedar Lane Brokers")!, creationDate: now, lastUpdated: now },
      { policyNumber: "AM-2026-01550", clientCompany: "Stonebridge Distribution", effectiveDate: dateOffset(180), status: "VALI", insuranceCompanyId: insuranceProviderIds.get("Atlas Mutual Assurance")!, intermediaryId: null, creationDate: dateOffset(180), lastUpdated: now },
    ]).returning().all().map(({ id, policyNumber }) => [policyNumber, id]),
  );

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
      { label: "Eastside Urgent Care", corporateName: "Eastside Clinics", profile: "EMERGENCY_PHYSICIAN", contactName: "James Wu", phone: "+1 555 020 1700", email: "referrals@eastside.example.test", bank: "BNA", bankAccount: "010-1700-7" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const recordSpecs: SeedMedicalRecord[] = [
    {
      reference: reference(dateOffset(1, 8)), accidentType: "AT", policyId: policyIds.get("AM-2026-00418")!, reportingDate: dateOffset(1, 9),
      reporterName: "Leah Morgan", reporterPhone: "+1 555 030 1001", accidentPlace: "WS", accidentDate: dateOffset(1, 8), accidentCause: "EQIP",
      victimFirstName: "Ethan", victimLastName: "Cole", victimPhone: "+1 555 030 2001", victimNationalId: "9001000001", victimJob: "Machine operator",
      status: "PRG", accidentEvolution: "INIT", delegationDate: null, regulatoryDoctor: null, manager: "Amin Hassan", lastUpdated: now, lastUpdater: "Amin Hassan", observation: "Initial report received by phone.",
    },
    {
      reference: reference(dateOffset(3, 10)), accidentType: "AT", policyId: policyIds.get("AM-2026-00972")!, reportingDate: dateOffset(3, 11),
      reporterName: "Noah Bennett", reporterPhone: "+1 555 030 1002", accidentPlace: "CT", accidentDate: dateOffset(3, 10), accidentCause: "FALL",
      victimFirstName: "Ava", victimLastName: "Turner", victimPhone: null, victimNationalId: "9001000002", victimJob: "Site supervisor",
      status: "PRG", accidentEvolution: "DEAT", delegationDate: dateOffset(3, 12), regulatoryDoctor: "Dr. Lin", manager: "Nadia Karim", lastUpdated: now, lastUpdater: "Nadia Karim", observation: "Case delegated for follow-up.",
    },
    {
      reference: reference(dateOffset(6, 7)), accidentType: "MD", policyId: policyIds.get("NS-2024-00136")!, reportingDate: dateOffset(6, 8),
      reporterName: "Rosa Diaz", reporterPhone: "+1 555 030 1003", accidentPlace: "OF", accidentDate: dateOffset(6, 7), accidentCause: "FATG",
      victimFirstName: "Lucas", victimLastName: "Perry", victimPhone: "+1 555 030 2003", victimNationalId: "9001000003", victimJob: "Warehouse associate",
      status: "RJC", accidentEvolution: "INIT", delegationDate: null, regulatoryDoctor: null, manager: "Amin Hassan", lastUpdated: now, lastUpdater: "Amin Hassan", observation: "Policy terminated before the reported event.",
    },
    {
      reference: reference(dateOffset(2, 12)), accidentType: "VF", policyId: policyIds.get("AM-2026-00418")!, reportingDate: dateOffset(2, 13),
      reporterName: "Grace Kim", reporterPhone: "+1 555 030 1004", accidentPlace: "OF", accidentDate: dateOffset(2, 12), accidentCause: null,
      victimFirstName: "Oliver", victimLastName: "Price", victimPhone: null, victimNationalId: "9001000004", victimJob: null,
      status: "CLS", accidentEvolution: "INIT", delegationDate: null, regulatoryDoctor: null, manager: "Nadia Karim", lastUpdated: now, lastUpdater: "Nadia Karim", observation: "Policy validity confirmed with insurer.",
    },
    {
      reference: reference(dateOffset(10, 9)), accidentType: "SS", policyId: policyIds.get("NS-2026-01005")!, reportingDate: dateOffset(10, 10),
      reporterName: "Daniel Foster", reporterPhone: "+1 555 030 1005", accidentPlace: "RT", accidentDate: dateOffset(10, 9), accidentCause: "OBJC",
      victimFirstName: "Mila", victimLastName: "Ward", victimPhone: "+1 555 030 2005", victimNationalId: "9001000005", victimJob: "Delivery driver",
      status: "RJC", accidentEvolution: "COMP", delegationDate: null, regulatoryDoctor: null, manager: "Amin Hassan", lastUpdated: now, lastUpdater: "Amin Hassan", observation: "Special service request awaiting documentation.",
    },
    {
      reference: reference(dateOffset(60, 8)), accidentType: "PR", policyId: policyIds.get("NS-2024-00136")!, reportingDate: dateOffset(60, 9),
      reporterName: "Hannah Scott", reporterPhone: "+1 555 030 1006", accidentPlace: "WS", accidentDate: dateOffset(60, 8), accidentCause: "HAZD",
      victimFirstName: "Isaac", victimLastName: "Green", victimPhone: "+1 555 030 2006", victimNationalId: "9001000006", victimJob: "Maintenance technician",
      status: "PRG", accidentEvolution: "RELP", delegationDate: null, regulatoryDoctor: null, manager: "Nadia Karim", lastUpdated: now, lastUpdater: "Nadia Karim", observation: "Historical event predates policy termination.",
    },
    {
      reference: reference(dateOffset(20, 13)), accidentType: "AT", policyId: policyIds.get("AM-2026-01550")!, reportingDate: dateOffset(20, 14),
      reporterName: "Mason Bell", reporterPhone: "+1 555 030 1007", accidentPlace: "WS", accidentDate: dateOffset(20, 13), accidentCause: "VIOL",
      victimFirstName: "Chloe", victimLastName: "Adams", victimPhone: null, victimNationalId: "9001000007", victimJob: "Inventory clerk",
      status: "ABN", accidentEvolution: "INIT", delegationDate: null, regulatoryDoctor: null, manager: "Amin Hassan", lastUpdated: now, lastUpdater: "Amin Hassan", observation: "Record abandoned after caller follow-up.",
    },
    {
      reference: reference(dateOffset(4, 9)), accidentType: "VF", policyId: policyIds.get("AM-2026-00972")!, reportingDate: dateOffset(4, 10),
      reporterName: "Sofia", reporterPhone: "+1 555 030 1008", accidentPlace: "OF", accidentDate: dateOffset(4, 9), accidentCause: null,
      victimFirstName: "Leo", victimLastName: null, victimPhone: null, victimNationalId: "9001000008", victimJob: null,
      status: "PRG", accidentEvolution: "INIT", delegationDate: null, regulatoryDoctor: null, manager: "Nadia Karim", lastUpdated: now, lastUpdater: "Nadia Karim", observation: null,
    },
  ];

  const recordIds = new Map(
    tx.insert(medicalRecords).values(recordSpecs).returning().all().map(({ id, reference }) => [reference, id]),
  );

  const invoiceRows: InvoiceSeedRow[] = [
    { reference: invoiceReference(dateOffset(12), 1), date: dateOffset(12), totalAmount: 710, insuranceProviderId: insuranceProviderIds.get("Atlas Mutual Assurance")!, bank: "BNA", paymentMode: "VRM", paymentReference: "INV-AT-001", cashed: true, cashingDate: dateOffset(8) },
    { reference: invoiceReference(dateOffset(24), 2), date: dateOffset(24), totalAmount: 820, insuranceProviderId: insuranceProviderIds.get("Northstar Coverage")!, bank: "BNA", paymentMode: "CHQ", paymentReference: "INV-NS-001", cashed: false, cashingDate: null },
  ];

  const invoiceIds = new Map(
    tx.insert(invoices).values(invoiceRows).returning().all().map(({ id, paymentReference }) => [paymentReference, id]),
  );

  const serviceRows: ServiceSeedRow[] = [
    { record: recordSpecs[0]!, type: "Emergency transport", provider: "MetroCare Ambulance", date: dateOffset(1, 15), paymentAmount: 450, billingAmount: 450, taxRate: 0, settlementStatus: "SETT", settlingDate: dateOffset(1, 16), paymentMode: "VRM", paymentReference: "PAY-001", bank: "BNA", invoiceId: invoiceIds.get("INV-AT-001")!, observation: "Transported for evaluation." },
    { record: recordSpecs[0]!, type: "Emergency physician assessment", provider: "Dr. Samuel Reed", date: dateOffset(1, 16), paymentAmount: 260, billingAmount: 260, taxRate: 0, settlementStatus: "BILL", settlingDate: null, paymentMode: null, paymentReference: null, bank: "BNA", invoiceId: invoiceIds.get("INV-AT-001")!, observation: "Initial examination completed." },
    { record: recordSpecs[1]!, type: "Hospital admission", provider: "St. Anne Medical Center", date: dateOffset(3, 15), paymentAmount: 960, billingAmount: 960, taxRate: 0, settlementStatus: "WAIT", settlingDate: null, paymentMode: null, paymentReference: null, bank: "BNA", invoiceId: null, observation: "Observation and imaging." },
    { record: recordSpecs[2]!, type: "General medical consultation", provider: "Dr. Maya Patel", date: dateOffset(6, 15), paymentAmount: 180, billingAmount: 180, taxRate: 0, settlementStatus: "WAIT", settlingDate: null, paymentMode: null, paymentReference: null, bank: "BNA", invoiceId: null, observation: "Policy validation pending." },
    { record: recordSpecs[3]!, type: "Regulatory review", provider: "Regional Work Safety Office", date: dateOffset(2, 15), paymentAmount: 150, billingAmount: 150, taxRate: 0, settlementStatus: "BILL", settlingDate: null, paymentMode: null, paymentReference: null, bank: "BNA", invoiceId: null, observation: "Eligibility checked." },
    { record: recordSpecs[4]!, type: "Medication dispensing", provider: "Green Cross Pharmacy", date: dateOffset(10, 15), paymentAmount: 120, billingAmount: 120, taxRate: 0, settlementStatus: "WAIT", settlingDate: null, paymentMode: null, paymentReference: null, bank: "BNA", invoiceId: null, observation: "Prescription fulfilled." },
    { record: recordSpecs[5]!, type: "Emergency physician assessment", provider: "Eastside Urgent Care", date: dateOffset(60, 15), paymentAmount: 260, billingAmount: 260, taxRate: 0, settlementStatus: "BILL", settlingDate: null, paymentMode: null, paymentReference: null, bank: "BNA", invoiceId: invoiceIds.get("INV-NS-001")!, observation: "Exposure-related symptoms assessed." },
    { record: recordSpecs[6]!, type: "General medical consultation", provider: "Dr. Maya Patel", date: dateOffset(20, 15), paymentAmount: 180, billingAmount: 180, taxRate: 0, settlementStatus: "WAIT", settlingDate: null, paymentMode: null, paymentReference: null, bank: "BNA", invoiceId: null, observation: "Follow-up appointment." },
  ];

  tx.insert(medicalServices).values(serviceRows.map((service) => ({
    medicalRecordId: recordIds.get(service.record.reference)!,
    serviceProviderId: serviceProviderIds.get(service.provider)!,
    serviceTypeId: serviceTypeIds.get(service.type)!,
    date: service.date,
    paymentAmount: service.paymentAmount,
    billingAmount: service.billingAmount,
    taxRate: service.taxRate,
    settlementStatus: service.settlementStatus,
    settlingDate: service.settlingDate,
    bank: service.bank,
    paymentMode: service.paymentMode,
    paymentReference: service.paymentReference,
    invoiceId: service.invoiceId,
    observation: service.observation,
  }))).run();

  const certificateRows = [
    { record: recordSpecs[0]!, type: "INIT" as const, provider: "Dr. Samuel Reed", daysNumber: 5, daysAgo: 1, observation: "Awaiting provider signature." },
    { record: recordSpecs[1]!, type: "INSP" as const, provider: "Dr. Samuel Reed", daysNumber: 3, daysAgo: 2, observation: "Initial review completed." },
    { record: recordSpecs[2]!, type: "INIT" as const, provider: "Dr. Maya Patel", daysNumber: 2, daysAgo: 5, observation: "Coverage decision pending." },
    { record: recordSpecs[3]!, type: "RETU" as const, provider: "Regional Work Safety Office", daysNumber: 0, daysAgo: 1, observation: null },
    { record: recordSpecs[4]!, type: "PROL" as const, provider: "Green Cross Pharmacy", daysNumber: 7, daysAgo: 9, observation: "Follow-up certificate." },
    { record: recordSpecs[5]!, type: "AGGR" as const, provider: "Eastside Urgent Care", daysNumber: 4, daysAgo: 59, observation: "Historical case certificate." },
    { record: recordSpecs[6]!, type: "RECO" as const, provider: "Dr. Maya Patel", daysNumber: 0, daysAgo: 19, observation: null },
  ];

  tx.insert(medicalCertificates).values(certificateRows.map((certificate) => ({
    medicalRecordId: recordIds.get(certificate.record.reference)!,
    type: certificate.type,
    serviceProviderId: serviceProviderIds.get(certificate.provider)!,
    dayCount: certificate.daysNumber,
    startDate: dateOffset(certificate.daysAgo),
    endDate: dateOffset(certificate.daysAgo - certificate.daysNumber),
    observation: certificate.observation,
  }))).run();

  return {
    insuranceProviders: insuranceProviderIds.size,
    insurancePolicies: policyIds.size,
    serviceTypes: serviceTypeIds.size,
    serviceProviders: serviceProviderIds.size,
    medicalRecords: recordIds.size,
    invoices: invoiceIds.size,
    medicalServices: serviceRows.length,
    medicalCertificates: certificateRows.length,
  };
});

try {
  console.info("Mock data generated:");
  for (const [table, count] of Object.entries(seededCounts)) console.info(`  ${table}: ${count}`);
} finally {
  db.$client.close();
}