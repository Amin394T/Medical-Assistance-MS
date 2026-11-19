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
      { label: "Assurance Atlas Maroc", corporateId: "MAA-1001", phone: "+212 5 22 00 10 01", email: "sinistres@atlas-assurance.example.test" },
      { label: "Mutuelle du Rif", corporateId: "MDR-1002", phone: "+212 5 39 00 10 02", email: "sinistres@mutuelle-rif.example.test" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const policyIds = new Map(
    tx.insert(insurancePolicies).values([
      { policyNumber: "MAA-2026-00418", clientCompany: "Ateliers du Cèdre", clientActivity: "Menuiserie et fabrication de meubles", clientAddress: "14 avenue Hassan-II", clientCity: "Casablanca", type: "REV" as const, effectiveDate: dateOffset(420), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Assurance Atlas Maroc", "insurance provider"), creationDate: dateOffset(420), lastUpdated: now },
      { policyNumber: "MAA-2026-00972", clientCompany: "Bâtiments Al Amal", clientActivity: "Construction et travaux publics", clientAddress: "82 avenue Mohammed-V", clientCity: "Rabat", type: "FIX" as const, effectiveDate: dateOffset(260), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Assurance Atlas Maroc", "insurance provider"), creationDate: dateOffset(260), lastUpdated: now },
      { policyNumber: "RIF-2024-00136", clientCompany: "Transports du Détroit", clientActivity: "Transport et logistique", clientAddress: "2 avenue d'Espagne", clientCity: "Tanger", type: "REV" as const, effectiveDate: dateOffset(700), status: "TERM" as const, insuranceCompanyId: getId(insuranceProviderIds, "Mutuelle du Rif", "insurance provider"), creationDate: dateOffset(700), lastUpdated: dateOffset(30) },
      { policyNumber: "RIF-2026-01005", clientCompany: "Services Électriques de l'Atlas", clientActivity: "Installation et maintenance électrique", clientAddress: "37 boulevard Abdelkrim-Khattabi", clientCity: "Marrakech", type: "FIX" as const, effectiveDate: dateOffset(-30), status: "SUSP" as const, insuranceCompanyId: getId(insuranceProviderIds, "Mutuelle du Rif", "insurance provider"), creationDate: now, lastUpdated: now },
      { policyNumber: "MAA-2026-01550", clientCompany: "Distribution Al Baraka", clientActivity: "Commerce et distribution", clientAddress: "9 avenue des FAR", clientCity: "Fès", type: "FIX" as const, effectiveDate: dateOffset(180), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Assurance Atlas Maroc", "insurance provider"), creationDate: dateOffset(180), lastUpdated: now },
      { policyNumber: "RIF-2026-02140", clientCompany: "Coopérative Arganière Souss", clientActivity: "Production et transformation de produits agricoles", clientAddress: "6 avenue Hassan-Ier", clientCity: "Agadir", type: "REV" as const, effectiveDate: dateOffset(90), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Mutuelle du Rif", "insurance provider"), creationDate: dateOffset(90), lastUpdated: now },
      { policyNumber: "MAA-2026-02178", clientCompany: "Hôtellerie Riad Medina", clientActivity: "Hôtellerie et restauration", clientAddress: "21 rue de la Kasbah", clientCity: "Marrakech", type: "FIX" as const, effectiveDate: dateOffset(60), status: "VALI" as const, insuranceCompanyId: getId(insuranceProviderIds, "Assurance Atlas Maroc", "insurance provider"), creationDate: dateOffset(60), lastUpdated: now },
    ]).returning().all().map(({ id, policyNumber }) => [policyNumber, id]),
  );

  tx.insert(insurancePolicyEmployees).values([
    { policyId: getId(policyIds, "MAA-2026-00972", "insurance policy"), employee: "Samira El Fassi" },
    { policyId: getId(policyIds, "MAA-2026-01550", "insurance policy"), employee: "Hamza El Idrissi" },
    { policyId: getId(policyIds, "RIF-2026-01005", "insurance policy"), employee: "Inès Aït Lahcen" },
    { policyId: getId(policyIds, "MAA-2026-02178", "insurance policy"), employee: "Nour El Amrani" },
  ]).run();

  const serviceTypeIds = new Map(
    tx.insert(serviceTypes).values([
      { label: "Transport d’urgence", paymentAmount: 800, billingAmount: 800, taxRate: 0, targetProfile: "Ambulance" },
      { label: "Évaluation par un médecin urgentiste", paymentAmount: 500, billingAmount: 500, taxRate: 0, targetProfile: "Médecin Urgentiste" },
      { label: "Consultation de médecine générale", paymentAmount: 300, billingAmount: 300, taxRate: 0, targetProfile: "Médecin Généraliste" },
      { label: "Hospitalisation", paymentAmount: 1800, billingAmount: 1800, taxRate: 0, targetProfile: "Hôpital" },
      { label: "Délivrance de médicaments", paymentAmount: 240, billingAmount: 240, taxRate: 0, targetProfile: "Pharmacie" },
      { label: "Évaluation médico-administrative", paymentAmount: 200, billingAmount: 200, taxRate: 0, targetProfile: "Médecin-Conseil" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const serviceProviderIds = new Map(
    tx.insert(serviceProviders).values([
      { label: "Ambulances Atlas Casablanca", corporateName: "Ambulances Atlas", profile: "Ambulance", contactName: "Imane El Idrissi", phone: "+212 6 61 00 20 01", email: "dispatch@ambulances-atlas.example.test", bank: "Attijariwafa Bank", bankAccount: "007780000000000000000001" },
      { label: "Dr Karim El Mansouri", corporateName: null, profile: "Médecin Urgentiste", contactName: "Karim El Mansouri", phone: "+212 6 62 00 20 02", email: "karim.elmansouri@medecins.example.test", bank: "Banque Populaire", bankAccount: "190780000000000000000002" },
      { label: "Dr Salma Amrani", corporateName: null, profile: "Médecin Généraliste", contactName: "Salma Amrani", phone: "+212 6 63 00 20 03", email: "salma.amrani@medecins.example.test", bank: "Attijariwafa Bank", bankAccount: "007780000000000000000003" },
      { label: "Centre Hospitalier Al Amal", corporateName: "Réseau Hospitalier Al Amal", profile: "Hôpital", contactName: "Hassan Berrada", phone: "+212 5 22 00 20 04", email: "admissions@al-amal.example.test", bank: "Bank of Africa", bankAccount: "011780000000000000000004" },
      { label: "Pharmacie Al Wifaq", corporateName: "Groupe Pharmaceutique Al Wifaq", profile: "Pharmacie", contactName: "Meryem Alaoui", phone: "+212 5 22 00 20 05", email: "commandes@alwifaq.example.test", bank: "Banque Populaire", bankAccount: "190780000000000000000005" },
      { label: "Médecine du Travail Atlas", corporateName: "Service de Médecine du Travail Atlas", profile: "Médecin-Conseil", contactName: "Dr Nabil Chraïbi", phone: "+212 5 24 00 20 06", email: "medtravail@atlas-sante.example.test", bank: "Attijariwafa Bank", bankAccount: "007780000000000000000006" },
    ]).returning().all().map(({ id, label }) => [label, id]),
  );

  const recordSpecs = [
    {
      reference: recordReference(dateOffset(1, 8)), accidentType: "AT" as const, policyNumber: "MAA-2026-00418", reportingDate: dateOffset(1, 9),
      reporterName: "Imane Berrada", reporterPhone: "+212 6 64 00 30 01", accidentPlace: "WS" as const, accidentDate: dateOffset(1, 8), accidentCause: "EQIP" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Yassine", victimLastName: "El Amrani", victimPhone: "+212 6 65 00 30 01", victimNationalId: "AB123456",
      victimJob: "Menuisier", status: "PRG" as const, delegationDate: null, regulatoryDoctor: null, manager: "Nadia El Fassi",
      observation: "Déclaration initiale reçue par téléphone.",
    },
    {
      reference: recordReference(dateOffset(3, 10)), accidentType: "AT" as const, policyNumber: "MAA-2026-00972", reportingDate: dateOffset(3, 11),
      reporterName: "Adil Benjelloun", reporterPhone: "+212 6 64 00 30 02", accidentPlace: "CT" as const, accidentDate: dateOffset(3, 10), accidentCause: "FALL" as const,
      accidentEvolution: "DEAT" as const, victimFirstName: "Samira", victimLastName: "El Fassi", victimPhone: null, victimNationalId: "CD234567",
      victimJob: "Cheffe de chantier", status: "DSP" as const, delegationDate: dateOffset(3, 12), regulatoryDoctor: "Dr Nabil Chraïbi", manager: "Rachid Alaoui",
      observation: "La décision relative à la police est contestée.",
    },
    {
      reference: recordReference(dateOffset(6, 7)), accidentType: "MD" as const, policyNumber: "RIF-2024-00136", reportingDate: dateOffset(6, 8),
      reporterName: "Rania El Haddad", reporterPhone: "+212 6 64 00 30 03", accidentPlace: "OF" as const, accidentDate: dateOffset(6, 7), accidentCause: "FATG" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Mehdi", victimLastName: "Alaoui", victimPhone: "+212 6 65 00 30 03", victimNationalId: "EF345678",
      victimJob: "Agent logistique", status: "RJC" as const, statusReason: "TER" as const, delegationDate: null, regulatoryDoctor: null, manager: "Nadia El Fassi",
      observation: "La police avait été résiliée avant l’événement déclaré.",
    },
    {
      reference: recordReference(dateOffset(2, 12)), accidentType: "VF" as const, policyNumber: "MAA-2026-00418", reportingDate: dateOffset(2, 13),
      reporterName: "Sara El Mansouri", reporterPhone: "+212 6 64 00 30 04", accidentPlace: "OF" as const, accidentDate: dateOffset(2, 12), accidentCause: null,
      accidentEvolution: "INIT" as const, victimFirstName: "Nour", victimLastName: "Eddine", victimPhone: null, victimNationalId: "GH456789",
      victimJob: null, status: "CLS" as const, delegationDate: null, regulatoryDoctor: null, manager: "Rachid Alaoui",
      observation: "La validité de la police a été confirmée auprès de l’assureur.",
    },
    {
      reference: recordReference(dateOffset(20, 13)), accidentType: "AT" as const, policyNumber: "MAA-2026-01550", reportingDate: dateOffset(20, 14),
      reporterName: "Othmane El Idrissi", reporterPhone: "+212 6 64 00 30 05", accidentPlace: "WS" as const, accidentDate: dateOffset(20, 13), accidentCause: "VIOL" as const,
      accidentEvolution: "RELP" as const, victimFirstName: "Hamza", victimLastName: "El Idrissi", victimPhone: null, victimNationalId: "JK567890",
      victimJob: "Gestionnaire de stocks", status: "ABN" as const, delegationDate: null, regulatoryDoctor: null, manager: "Nadia El Fassi",
      observation: "Le dossier a été abandonné après un suivi auprès du déclarant.",
    },
    {
      reference: recordReference(dateOffset(10, 9)), accidentType: "AT" as const, policyNumber: "MAA-2026-00418", reportingDate: dateOffset(10, 10),
      reporterName: "Nadia Benjelloun", reporterPhone: "+212 6 64 00 30 06", accidentPlace: "WS" as const, accidentDate: dateOffset(10, 9), accidentCause: "OBJC" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Youssef", victimLastName: "Aït Lahcen", victimPhone: "+212 6 65 00 30 06", victimNationalId: "LM678901",
      victimJob: "Technicien de maintenance", status: "PRG" as const, delegationDate: null, regulatoryDoctor: null, manager: "Rachid Alaoui",
      observation: "La victime a été blessée par un objet en mouvement dans l’atelier.",
    },
    {
      reference: recordReference(dateOffset(12, 11)), accidentType: "MD" as const, policyNumber: "RIF-2026-01005", reportingDate: dateOffset(12, 12),
      reporterName: "Lina El Alaoui", reporterPhone: "+212 6 64 00 30 07", accidentPlace: "OF" as const, accidentDate: dateOffset(12, 11), accidentCause: null,
      accidentEvolution: "INIT" as const, victimFirstName: "Inès", victimLastName: "Aït Lahcen", victimPhone: null, victimNationalId: "NP789012",
      victimJob: "Assistante administrative", status: "RJC" as const, statusReason: "SUS" as const, delegationDate: null, regulatoryDoctor: null, manager: "Nadia El Fassi",
      observation: "La demande est en attente de la régularisation de la police suspendue.",
    },
    {
      reference: recordReference(dateOffset(4, 8)), accidentType: "AT" as const, policyNumber: "RIF-2026-02140", reportingDate: dateOffset(4, 9),
      reporterName: "Meryem Chraïbi", reporterPhone: "+212 6 64 00 30 08", accidentPlace: "WS" as const, accidentDate: dateOffset(4, 8), accidentCause: "EQIP" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Khalid", victimLastName: "Benjelloun", victimPhone: "+212 6 65 00 30 08", victimNationalId: "QR890123",
      victimJob: "Opérateur de production", status: "PRG" as const, delegationDate: null, regulatoryDoctor: null, manager: "Rachid Alaoui",
      observation: "Blessure à la main lors de l'utilisation d'une machine de conditionnement.",
    },
    {
      reference: recordReference(dateOffset(8, 9)), accidentType: "MD" as const, policyNumber: "MAA-2026-02178", reportingDate: dateOffset(8, 10),
      reporterName: "Nour El Amrani", reporterPhone: "+212 6 64 00 30 09", accidentPlace: "OF" as const, accidentDate: dateOffset(8, 9), accidentCause: null,
      accidentEvolution: "INIT" as const, victimFirstName: "Nour", victimLastName: "El Amrani", victimPhone: "+212 6 65 00 30 09", victimNationalId: "ST901234",
      victimJob: "Réceptionniste", status: "PRG" as const, delegationDate: null, regulatoryDoctor: null, manager: "Nadia El Fassi",
      observation: "Consultation demandée à la suite de douleurs apparues pendant le service.",
    },
    {
      reference: recordReference(dateOffset(9, 8)), accidentType: "VF" as const, policyNumber: "MAA-2026-02178", reportingDate: dateOffset(9, 9),
      reporterName: "Amine El Fassi", reporterPhone: "+212 6 64 00 30 10", accidentPlace: "OF" as const, accidentDate: dateOffset(9, 8), accidentCause: null,
      accidentEvolution: "INIT" as const, victimFirstName: "Amine", victimLastName: "El Fassi", victimPhone: null, victimNationalId: "UV012345",
      victimJob: null, status: "RJC" as const, statusReason: "COV" as const, delegationDate: null, regulatoryDoctor: null, manager: "Rachid Alaoui",
      observation: "La personne déclarée ne figure pas sur la liste des salariés couverts.",
    },
    {
      reference: recordReference(dateOffset(14, 10)), accidentType: "PR" as const, policyNumber: "RIF-2026-02140", reportingDate: dateOffset(14, 11),
      reporterName: "Hicham Alaoui", reporterPhone: "+212 6 64 00 30 11", accidentPlace: "WS" as const, accidentDate: dateOffset(14, 10), accidentCause: "HAZD" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Meryem", victimLastName: "Chraïbi", victimPhone: "+212 6 65 00 30 11", victimNationalId: "WX123456",
      victimJob: "Préparatrice de produits agricoles", status: "PRG" as const, delegationDate: null, regulatoryDoctor: null, manager: "Nadia El Fassi",
      observation: "Une irritation respiratoire est signalée après une exposition répétée aux poussières.",
    },
    {
      reference: recordReference(dateOffset(16, 12)), accidentType: "SS" as const, policyNumber: "MAA-2026-01550", reportingDate: dateOffset(16, 13),
      reporterName: "Hamza El Idrissi", reporterPhone: "+212 6 64 00 30 12", accidentPlace: "RT" as const, accidentDate: dateOffset(16, 12), accidentCause: "FALL" as const,
      accidentEvolution: "INIT" as const, victimFirstName: "Hamza", victimLastName: "El Idrissi", victimPhone: "+212 6 65 00 30 12", victimNationalId: "YZ234567",
      victimJob: "Gestionnaire de stocks", status: "CLS" as const, delegationDate: null, regulatoryDoctor: null, manager: "Rachid Alaoui",
      observation: "Évaluation médicale effectuée après une chute lors d'un déplacement professionnel.",
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
    { record: recordSpecs[0]!, type: "Transport d’urgence", provider: "Ambulances Atlas Casablanca", date: dateOffset(1, 15), observation: "Transport vers un centre médical pour évaluation.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[0]!, type: "Évaluation par un médecin urgentiste", provider: "Dr Karim El Mansouri", date: dateOffset(1, 16), observation: "Examen initial effectué.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[0]!, type: "Hospitalisation", provider: "Centre Hospitalier Al Amal", date: dateOffset(1, 18), observation: "Observation médicale et imagerie.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[1]!, type: "Évaluation par un médecin urgentiste", provider: "Dr Karim El Mansouri", date: dateOffset(3, 14), observation: "Évaluation liée au dossier contesté.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[2]!, type: "Consultation de médecine générale", provider: "Dr Salma Amrani", date: dateOffset(6, 15), observation: "Prestation effectuée pendant l’examen de la police.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[3]!, type: "Évaluation médico-administrative", provider: "Médecine du Travail Atlas", date: dateOffset(2, 15), observation: "Vérification de l’admissibilité effectuée.", settlementStatus: "SETT" as const },
    { record: recordSpecs[4]!, type: "Délivrance de médicaments", provider: "Pharmacie Al Wifaq", date: dateOffset(20, 15), observation: "Ordonnance délivrée.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[5]!, type: "Transport d’urgence", provider: "Ambulances Atlas Casablanca", date: dateOffset(10, 14), observation: "Transport de la victime vers le centre médical.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[5]!, type: "Évaluation par un médecin urgentiste", provider: "Dr Karim El Mansouri", date: dateOffset(10, 16), observation: "Évaluation initiale de la blessure.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[6]!, type: "Consultation de médecine générale", provider: "Dr Salma Amrani", date: dateOffset(12, 15), observation: "Consultation effectuée pendant la suspension de la police.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[7]!, type: "Transport d’urgence", provider: "Ambulances Atlas Casablanca", date: dateOffset(4, 12), observation: "Transport depuis le site de production vers le centre hospitalier.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[7]!, type: "Évaluation par un médecin urgentiste", provider: "Dr Karim El Mansouri", date: dateOffset(4, 14), observation: "Évaluation de la blessure à la main et prescription de soins.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[8]!, type: "Consultation de médecine générale", provider: "Dr Salma Amrani", date: dateOffset(8, 14), observation: "Consultation initiale pour douleurs apparues au travail.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[8]!, type: "Délivrance de médicaments", provider: "Pharmacie Al Wifaq", date: dateOffset(8, 16), observation: "Traitement prescrit délivré à la salariée.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[9]!, type: "Évaluation médico-administrative", provider: "Médecine du Travail Atlas", date: dateOffset(9, 11), observation: "Vérification de l’inscription de la personne sur la police.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[10]!, type: "Consultation de médecine générale", provider: "Dr Salma Amrani", date: dateOffset(14, 14), observation: "Examen des symptômes liés à l’exposition professionnelle.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[10]!, type: "Hospitalisation", provider: "Centre Hospitalier Al Amal", date: dateOffset(13, 10), observation: "Examens complémentaires et surveillance médicale.", settlementStatus: "WAIT" as const },
    { record: recordSpecs[11]!, type: "Évaluation par un médecin urgentiste", provider: "Dr Karim El Mansouri", date: dateOffset(16, 15), observation: "Examen après une chute lors d’un déplacement professionnel.", settlementStatus: "WAIT" as const },
  ];

  // Monetary seed values use Moroccan dirhams (MAD).
  const amounts = new Map([
    ["Transport d’urgence", 800],
    ["Évaluation par un médecin urgentiste", 500],
    ["Consultation de médecine générale", 300],
    ["Hospitalisation", 1800],
    ["Délivrance de médicaments", 240],
    ["Évaluation médico-administrative", 200],
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
      bank: "Attijariwafa Bank",
      paymentMode: service.settlementStatus === "SETT" ? "VRM" as const : null,
      paymentReference: service.settlementStatus === "SETT" ? "PAY-001" : null,
    };
  });
  const createdServices = tx.insert(medicalServices).values(serviceRows).returning().all();

  const invoiceOneServices = createdServices
    .filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[0]!.reference), "medical record"))
    .slice(0, 2);
  const invoiceTwoServices = createdServices.filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[1]!.reference), "medical record"));
  const invoiceThreeServices = createdServices.filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[5]!.reference), "medical record"));
  const invoiceFourServices = createdServices.filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[7]!.reference), "medical record"));
  const invoiceFiveServices = createdServices.filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[8]!.reference), "medical record"));
  const invoiceSixServices = createdServices.filter((service) => service.medicalRecordId === getId(recordIds, String(recordSpecs[10]!.reference), "medical record"));
  const invoiceDate = dateOffset(0);
  const invoiceRows = [
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[0]!.reference), "medical record"),
      reference: billingReference(invoiceDate, 1),
      issueDate: invoiceDate,
      totalAmount: invoiceOneServices.reduce((total, service) => total + service.billingAmount, 0),
    },
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[1]!.reference), "medical record"),
      reference: billingReference(invoiceDate, 2),
      issueDate: invoiceDate,
      totalAmount: invoiceTwoServices.reduce((total, service) => total + service.billingAmount, 0),
    },
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[5]!.reference), "medical record"),
      reference: billingReference(invoiceDate, 3),
      issueDate: invoiceDate,
      totalAmount: invoiceThreeServices.reduce((total, service) => total + service.billingAmount, 0),
    },
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[7]!.reference), "medical record"),
      reference: billingReference(invoiceDate, 4),
      issueDate: invoiceDate,
      totalAmount: invoiceFourServices.reduce((total, service) => total + service.billingAmount, 0),
    },
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[8]!.reference), "medical record"),
      reference: billingReference(invoiceDate, 5),
      issueDate: invoiceDate,
      totalAmount: invoiceFiveServices.reduce((total, service) => total + service.billingAmount, 0),
    },
    {
      medicalRecordId: getId(recordIds, String(recordSpecs[10]!.reference), "medical record"),
      reference: billingReference(invoiceDate, 6),
      issueDate: invoiceDate,
      totalAmount: invoiceSixServices.reduce((total, service) => total + service.billingAmount, 0),
    },
  ];
  const createdInvoices = tx.insert(billingInvoices).values(invoiceRows).returning().all();
  const invoiceOne = createdInvoices[0];
  const invoiceTwo = createdInvoices[1];
  const invoiceThree = createdInvoices[2];
  const invoiceFour = createdInvoices[3];
  const invoiceFive = createdInvoices[4];
  const invoiceSix = createdInvoices[5];
  if (!invoiceOne || !invoiceTwo || !invoiceThree || !invoiceFour || !invoiceFive || !invoiceSix) throw new Error("Unable to seed billing invoices.");

  tx.update(medicalServices)
    .set({ invoiceId: invoiceOne.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceOneServices.map(({ id }) => id)))
    .run();
  tx.update(medicalServices)
    .set({ invoiceId: invoiceTwo.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceTwoServices.map(({ id }) => id)))
    .run();
  tx.update(medicalServices)
    .set({ invoiceId: invoiceThree.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceThreeServices.map(({ id }) => id)))
    .run();
  tx.update(medicalServices)
    .set({ invoiceId: invoiceFour.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceFourServices.map(({ id }) => id)))
    .run();
  tx.update(medicalServices)
    .set({ invoiceId: invoiceFive.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceFiveServices.map(({ id }) => id)))
    .run();
  tx.update(medicalServices)
    .set({ invoiceId: invoiceSix.id, settlementStatus: "BILL" })
    .where(inArray(medicalServices.id, invoiceSixServices.map(({ id }) => id)))
    .run();

  const cashingRows = tx.insert(billingCashings).values([
    {
      insuranceProviderId: getId(insuranceProviderIds, "Assurance Atlas Maroc", "insurance provider"),
      requestDate: dateOffset(0),
      totalAmount: invoiceOne.totalAmount,
      bank: "Attijariwafa Bank",
      paymentMode: "VRM",
      paymentReference: "CASH-MA-001",
      cashed: true,
      cashingDate: dateOffset(0),
    },
    {
      insuranceProviderId: getId(insuranceProviderIds, "Assurance Atlas Maroc", "insurance provider"),
      requestDate: dateOffset(0),
      totalAmount: invoiceTwo.totalAmount,
      bank: "Banque Populaire",
      paymentMode: "CHQ",
      paymentReference: "CASH-MA-002",
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
    { record: recordSpecs[0]!, type: "INIT" as const, provider: "Dr Karim El Mansouri", dayCount: 5, daysAgo: 1, observation: "En attente de la signature du prestataire." },
    { record: recordSpecs[1]!, type: "INSP" as const, provider: "Dr Karim El Mansouri", dayCount: 3, daysAgo: 2, observation: "Contrôle effectué." },
    { record: recordSpecs[2]!, type: "INIT" as const, provider: "Dr Salma Amrani", dayCount: 2, daysAgo: 5, observation: "Décision de prise en charge en attente." },
    { record: recordSpecs[4]!, type: "PROL" as const, provider: "Pharmacie Al Wifaq", dayCount: 7, daysAgo: 9, observation: "Certificat de suivi." },
    { record: recordSpecs[5]!, type: "INIT" as const, provider: "Dr Karim El Mansouri", dayCount: 4, daysAgo: 10, observation: "Certificat initial de prise en charge." },
    { record: recordSpecs[6]!, type: "INSP" as const, provider: "Dr Salma Amrani", dayCount: 2, daysAgo: 12, observation: "Contrôle requis pour la demande en attente." },
    { record: recordSpecs[7]!, type: "INIT" as const, provider: "Dr Karim El Mansouri", dayCount: 6, daysAgo: 4, observation: "Certificat initial établi après l’accident de travail." },
    { record: recordSpecs[8]!, type: "INIT" as const, provider: "Dr Salma Amrani", dayCount: 2, daysAgo: 8, observation: "Repos prescrit à la suite de la consultation." },
    { record: recordSpecs[10]!, type: "INSP" as const, provider: "Médecine du Travail Atlas", dayCount: 5, daysAgo: 13, observation: "Suivi de l’exposition professionnelle et de ses symptômes." },
    { record: recordSpecs[11]!, type: "RECO" as const, provider: "Dr Karim El Mansouri", dayCount: 1, daysAgo: 15, observation: "Reprise du travail autorisée après examen." },
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

console.info("Données de démonstration générées :");
for (const [table, count] of Object.entries(counts)) console.info(`  ${table}: ${count}`);
db.$client.close();
