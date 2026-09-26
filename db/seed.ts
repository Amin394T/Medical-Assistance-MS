import { db } from "./index";
import {
  insurancePolicies,
  insuranceProviders,
  medicalDocuments,
  medicalRecords,
  medicalServices,
  serviceProviders,
  serviceTypes,
} from "./schemas";
import type { NewMedicalRecord } from "./schemas";

const now = new Date();

function dateOffset(days: number, hour = 10) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function reference(recordType: NewMedicalRecord["recordType"], accidentDate: Date, sequence = 1) {
  return `${recordType}${accidentDate.toISOString().slice(0, 10).replaceAll("-", "")}${String(sequence).padStart(2, "0")}`;
}

const seededCounts = db.transaction((tx) => {
  tx.delete(medicalDocuments).run();
  tx.delete(medicalServices).run();
  tx.delete(medicalRecords).run();
  tx.delete(insurancePolicies).run();
  tx.delete(serviceProviders).run();
  tx.delete(serviceTypes).run();
  tx.delete(insuranceProviders).run();

  const insuranceProviderIds = new Map(
    tx.insert(insuranceProviders).values([
      { label: "Atlas Mutual Assurance", corporateName: "Atlas Mutual Group", corporateId: "CMP-1001", type: "CMP", phone: "+1 555 010 1100", email: "claims@atlas.example.test" },
      { label: "Northstar Coverage", corporateName: "Northstar Insurance Ltd.", corporateId: "CMP-1002", type: "CMP", phone: "+1 555 010 1200", email: "claims@northstar.example.test" },
      { label: "Cedar Lane Brokers", corporateName: "Cedar Lane Brokerage", corporateId: "BRK-2001", type: "BRK", phone: "+1 555 010 2100", email: "service@cedarlane.example.test" },
      { label: "Harbor Insurance Agency", corporateName: "Harbor Agency LLC", corporateId: "AGT-3001", type: "AGT", phone: "+1 555 010 3100", email: "policies@harboragency.example.test" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const policyIds = new Map(
    tx.insert(insurancePolicies).values([
      { policyNumber: "AM-2026-00418", clientCompany: "Maple Works Manufacturing", effectiveDate: dateOffset(420), insuranceCompanyId: insuranceProviderIds.get("Atlas Mutual Assurance")!, intermediateId: insuranceProviderIds.get("Cedar Lane Brokers")!, terminated: false, terminationDate: null, type: "REV", createdAt: dateOffset(420), updatedAt: now },
      { policyNumber: "AM-2026-00972", clientCompany: "Brightline Construction", effectiveDate: dateOffset(260), insuranceCompanyId: insuranceProviderIds.get("Atlas Mutual Assurance")!, intermediateId: insuranceProviderIds.get("Harbor Insurance Agency")!, terminated: false, terminationDate: null, type: "FIX", createdAt: dateOffset(260), updatedAt: now },
      { policyNumber: "NS-2024-00136", clientCompany: "Riverside Food Logistics", effectiveDate: dateOffset(700), insuranceCompanyId: insuranceProviderIds.get("Northstar Coverage")!, intermediateId: null, terminated: true, terminationDate: dateOffset(30), type: "REV", createdAt: dateOffset(700), updatedAt: dateOffset(30) },
      { policyNumber: "NS-2026-01005", clientCompany: "Juniper Electrical Services", effectiveDate: dateOffset(-30), insuranceCompanyId: insuranceProviderIds.get("Northstar Coverage")!, intermediateId: insuranceProviderIds.get("Cedar Lane Brokers")!, terminated: false, terminationDate: null, type: "FIX", createdAt: now, updatedAt: now },
      { policyNumber: "AM-2026-01550", clientCompany: "Stonebridge Distribution", effectiveDate: dateOffset(180), insuranceCompanyId: insuranceProviderIds.get("Atlas Mutual Assurance")!, intermediateId: null, terminated: false, terminationDate: null, type: "REV", createdAt: dateOffset(180), updatedAt: now },
    ]).returning().all().map(({ id, policyNumber }) => [policyNumber, id]),
  );

  const serviceTypeIds = new Map(
    tx.insert(serviceTypes).values([
      { label: "Emergency transport", targetProfile: "AMBULANCE" },
      { label: "Emergency physician assessment", targetProfile: "EMERGENCY_PHYSICIAN" },
      { label: "General medical consultation", targetProfile: "GENERAL_PRACTITIONER" },
      { label: "Hospital admission", targetProfile: "HOSPITAL" },
      { label: "Medication dispensing", targetProfile: "PHARMACY" },
      { label: "Regulatory review", targetProfile: "REGULATOR" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const serviceProviderIds = new Map(
    tx.insert(serviceProviders).values([
      { label: "MetroCare Ambulance", corporateName: "MetroCare Response", profile: "AMBULANCE", contactName: "Lina Haddad", phone: "+1 555 020 1100", email: "dispatch@metrocare.example.test" },
      { label: "Dr. Samuel Reed", corporateName: null, profile: "EMERGENCY_PHYSICIAN", contactName: "Samuel Reed", phone: "+1 555 020 1200", email: "s.reed@caremail.example.test" },
      { label: "Dr. Maya Patel", corporateName: null, profile: "GENERAL_PRACTITIONER", contactName: "Maya Patel", phone: "+1 555 020 1300", email: "m.patel@caremail.example.test" },
      { label: "St. Anne Medical Center", corporateName: "St. Anne Health Network", profile: "HOSPITAL", contactName: "Omar Youssef", phone: "+1 555 020 1400", email: "intake@stanne.example.test" },
      { label: "Green Cross Pharmacy", corporateName: "Green Cross Health", profile: "PHARMACY", contactName: "Nora James", phone: "+1 555 020 1500", email: "claims@greencross.example.test" },
      { label: "Regional Work Safety Office", corporateName: "Regional Work Safety Office", profile: "REGULATOR", contactName: "Elena Brooks", phone: "+1 555 020 1600", email: "review@worksafety.example.test" },
      { label: "Eastside Urgent Care", corporateName: "Eastside Clinics", profile: "EMERGENCY_PHYSICIAN", contactName: "James Wu", phone: "+1 555 020 1700", email: "referrals@eastside.example.test" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const recordSpecs: NewMedicalRecord[] = [
    {
      reference: reference("AT", dateOffset(1)), recordType: "AT", policyId: policyIds.get("AM-2026-00418")!, reportingDate: dateOffset(1, 9),
      reporterFirstName: "Leah", reporterLastName: "Morgan", reporterPhone: "+1 555 030 1001", accidentPlace: "WS", accidentDate: dateOffset(1, 8), accidentCause: "EQIP",
      victimFirstName: "Ethan", victimLastName: "Cole", victimPhone: "+1 555 030 2001", victimNationalId: "9001000001", victimJob: "Machine operator",
      accidentEvolution: "INIT", delegationDate: null, coverageIssued: null, coverageDate: null, regulatorId: null, recordStatus: "PROG", lastAction: dateOffset(1, 9), managedBy: "Amin Hassan", observation: "Initial report received by phone.",
    },
    {
      reference: reference("AT", dateOffset(3)), recordType: "AT", policyId: policyIds.get("AM-2026-00972")!, reportingDate: dateOffset(3, 11),
      reporterFirstName: "Noah", reporterLastName: "Bennett", reporterPhone: "+1 555 030 1002", accidentPlace: "CS", accidentDate: dateOffset(3, 10), accidentCause: "FALL",
      victimFirstName: "Ava", victimLastName: "Turner", victimPhone: null, victimNationalId: "9001000002", victimJob: "Site supervisor",
      accidentEvolution: "DELG", delegationDate: dateOffset(3, 12), coverageIssued: true, coverageDate: dateOffset(2, 0), regulatorId: serviceProviderIds.get("Regional Work Safety Office")!, recordStatus: "SETT", lastAction: dateOffset(2, 14), managedBy: "Nadia Karim", observation: "Case delegated for follow-up.",
    },
    {
      reference: reference("MD", dateOffset(6)), recordType: "MD", policyId: policyIds.get("NS-2024-00136")!, reportingDate: dateOffset(6, 8),
      reporterFirstName: "Rosa", reporterLastName: "Diaz", reporterPhone: "+1 555 030 1003", accidentPlace: "OF", accidentDate: dateOffset(6, 7), accidentCause: "FATG",
      victimFirstName: "Lucas", victimLastName: "Perry", victimPhone: "+1 555 030 2003", victimNationalId: "9001000003", victimJob: "Warehouse associate",
      accidentEvolution: "INIT", delegationDate: null, coverageIssued: false, coverageDate: null, regulatorId: null, recordStatus: "PROG", lastAction: dateOffset(6, 9), managedBy: "Amin Hassan", observation: "Policy was terminated before the reported event.",
    },
    {
      reference: reference("VF", dateOffset(2)), recordType: "VF", policyId: policyIds.get("AM-2026-00418")!, reportingDate: dateOffset(2, 13),
      reporterFirstName: "Grace", reporterLastName: "Kim", reporterPhone: "+1 555 030 1004", accidentPlace: "OF", accidentDate: dateOffset(2, 12), accidentCause: null,
      victimFirstName: "Oliver", victimLastName: "Price", victimPhone: null, victimNationalId: "9001000004", victimJob: null,
      accidentEvolution: "INIT", delegationDate: null, coverageIssued: null, coverageDate: null, regulatorId: null, recordStatus: "CLOS", lastAction: dateOffset(1, 15), managedBy: "Nadia Karim", observation: "Policy validity confirmed with insurer.",
    },
    {
      reference: reference("SS", dateOffset(10)), recordType: "SS", policyId: policyIds.get("NS-2026-01005")!, reportingDate: dateOffset(10, 10),
      reporterFirstName: "Daniel", reporterLastName: "Foster", reporterPhone: "+1 555 030 1005", accidentPlace: "RT", accidentDate: dateOffset(10, 9), accidentCause: "OBJC",
      victimFirstName: "Mila", victimLastName: "Ward", victimPhone: "+1 555 030 2005", victimNationalId: "9001000005", victimJob: "Delivery driver",
      accidentEvolution: "COMP", delegationDate: null, coverageIssued: true, coverageDate: dateOffset(9, 0), regulatorId: null, recordStatus: "BILL", lastAction: dateOffset(8, 16), managedBy: "Amin Hassan", observation: "Special service request awaiting documentation.",
    },
    {
      reference: reference("PR", dateOffset(60)), recordType: "PR", policyId: policyIds.get("NS-2024-00136")!, reportingDate: dateOffset(60, 9),
      reporterFirstName: "Hannah", reporterLastName: "Scott", reporterPhone: "+1 555 030 1006", accidentPlace: "WS", accidentDate: dateOffset(60, 8), accidentCause: "HAZD",
      victimFirstName: "Isaac", victimLastName: "Green", victimPhone: "+1 555 030 2006", victimNationalId: "9001000006", victimJob: "Maintenance technician",
      accidentEvolution: "RELP", delegationDate: null, coverageIssued: true, coverageDate: dateOffset(59, 0), regulatorId: serviceProviderIds.get("Regional Work Safety Office")!, recordStatus: "PROG", lastAction: dateOffset(4, 11), managedBy: "Nadia Karim", observation: "Historical event predates policy termination.",
    },
    {
      reference: reference("AT", dateOffset(20)), recordType: "AT", policyId: policyIds.get("AM-2026-01550")!, reportingDate: dateOffset(20, 14),
      reporterFirstName: "Mason", reporterLastName: "Bell", reporterPhone: "+1 555 030 1007", accidentPlace: "WS", accidentDate: dateOffset(20, 13), accidentCause: "VIOL",
      victimFirstName: "Chloe", victimLastName: "Adams", victimPhone: null, victimNationalId: "9001000007", victimJob: "Inventory clerk",
      accidentEvolution: "DEAT", delegationDate: null, coverageIssued: false, coverageDate: null, regulatorId: null, recordStatus: "ABAN", lastAction: dateOffset(14, 10), managedBy: "Amin Hassan", observation: "Record abandoned after caller follow-up.",
    },
    {
      reference: reference("VF", dateOffset(4)), recordType: "VF", policyId: policyIds.get("AM-2026-00972")!, reportingDate: dateOffset(4, 10),
      reporterFirstName: "Sofia", reporterLastName: null, reporterPhone: "+1 555 030 1008", accidentPlace: "OF", accidentDate: dateOffset(4, 9), accidentCause: null,
      victimFirstName: "Leo", victimLastName: "Howard", victimPhone: null, victimNationalId: "9001000008", victimJob: null,
      accidentEvolution: "INIT", delegationDate: null, coverageIssued: null, coverageDate: null, regulatorId: null, recordStatus: "PROG", lastAction: dateOffset(4, 11), managedBy: "Nadia Karim", observation: null,
    },
  ];

  const recordIds = new Map(
    tx.insert(medicalRecords).values(recordSpecs).returning().all().map(({ id, reference }) => [reference, id]),
  );

  const serviceRows = [
    { record: recordSpecs[0]!, type: "Emergency transport", provider: "MetroCare Ambulance", daysAfter: 1, place: "Maple Works loading bay", observation: "Transported for evaluation." },
    { record: recordSpecs[0]!, type: "Emergency physician assessment", provider: "Dr. Samuel Reed", daysAfter: 1, place: "St. Anne Medical Center", observation: "Initial examination completed." },
    { record: recordSpecs[1]!, type: "Hospital admission", provider: "St. Anne Medical Center", daysAfter: 3, place: "Brightline North project", observation: "Observation and imaging." },
    { record: recordSpecs[2]!, type: "General medical consultation", provider: "Dr. Maya Patel", daysAfter: 6, place: "Riverside distribution office", observation: "Policy validation pending." },
    { record: recordSpecs[3]!, type: "Regulatory review", provider: "Regional Work Safety Office", daysAfter: 2, place: "Remote review", observation: "Eligibility checked." },
    { record: recordSpecs[4]!, type: "Medication dispensing", provider: "Green Cross Pharmacy", daysAfter: 9, place: "Juniper service depot", observation: "Prescription fulfilled." },
    { record: recordSpecs[5]!, type: "Emergency physician assessment", provider: "Eastside Urgent Care", daysAfter: 60, place: "Riverside logistics facility", observation: "Exposure-related symptoms assessed." },
    { record: recordSpecs[6]!, type: "General medical consultation", provider: "Dr. Maya Patel", daysAfter: 20, place: "Stonebridge warehouse", observation: "Follow-up appointment." },
  ];

  tx.insert(medicalServices).values(serviceRows.map((service) => ({
    medicalRecordId: recordIds.get(service.record.reference)!,
    serviceProviderId: serviceProviderIds.get(service.provider)!,
    serviceTypeId: serviceTypeIds.get(service.type)!,
    missionDate: dateOffset(service.daysAfter, 15),
    missionPlace: service.place,
    observation: service.observation,
  }))).run();

  const documentRows = [
    { record: recordSpecs[0]!, type: "Incident report", provider: "MetroCare Ambulance", signed: true, observation: "Signed transport intake form." },
    { record: recordSpecs[0]!, type: "Medical certificate", provider: "Dr. Samuel Reed", signed: false, observation: "Awaiting provider signature." },
    { record: recordSpecs[1]!, type: "Coverage letter", provider: "St. Anne Medical Center", signed: true, observation: null },
    { record: recordSpecs[2]!, type: "Policy verification", provider: "Dr. Maya Patel", signed: false, observation: "Coverage decision pending." },
    { record: recordSpecs[3]!, type: "Eligibility confirmation", provider: "Regional Work Safety Office", signed: true, observation: null },
    { record: recordSpecs[4]!, type: "Prescription receipt", provider: "Green Cross Pharmacy", signed: true, observation: "Dispensing receipt attached." },
    { record: recordSpecs[5]!, type: "Medical certificate", provider: "Eastside Urgent Care", signed: true, observation: "Historical case document." },
    { record: recordSpecs[6]!, type: "Follow-up note", provider: "Dr. Maya Patel", signed: false, observation: null },
    { record: recordSpecs[7]!, type: "Policy verification", provider: "Regional Work Safety Office", signed: true, observation: "Policy in force on reported date." },
  ];

  tx.insert(medicalDocuments).values(documentRows.map((document) => ({
    medicalRecordId: recordIds.get(document.record.reference)!,
    type: document.type,
    serviceProviderId: serviceProviderIds.get(document.provider)!,
    observation: document.observation,
    signed: document.signed,
  }))).run();

  return {
    insuranceProviders: insuranceProviderIds.size,
    insurancePolicies: policyIds.size,
    serviceTypes: serviceTypeIds.size,
    serviceProviders: serviceProviderIds.size,
    medicalRecords: recordIds.size,
    medicalServices: serviceRows.length,
    medicalDocuments: documentRows.length,
  };
});

try {
  console.info("Mock data generated:");
  for (const [table, count] of Object.entries(seededCounts)) console.info(`  ${table}: ${count}`);
} finally {
  db.$client.close();
}