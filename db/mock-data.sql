-- Development fixture data for the Medical Assistance MS SQLite database.
-- Run with: sqlite3 db/local.db < db/mock-data.sql

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

INSERT OR IGNORE INTO insurance_providers
  (id, label, company_name, company_id, type, phone, fax, email, created_at, updated_at)
VALUES
  (1, 'Atlas Assurance', 'Atlas Assurance Group', 'ATLAS-001', 'company', '+33 1 40 10 20 30', '+33 1 40 10 20 31', 'claims@atlas-assurance.example', strftime('%s', '2025-01-02') * 1000, strftime('%s', '2025-01-02') * 1000),
  (2, 'Northstar Mutual', 'Northstar Mutual Insurance', 'NSTAR-014', 'company', '+33 1 44 20 30 40', '+33 1 44 20 30 41', 'claims@northstar.example', strftime('%s', '2025-01-03') * 1000, strftime('%s', '2025-01-03') * 1000),
  (3, 'Helios Coverage', 'Helios Coverage SA', 'HELIOS-022', 'company', '+33 1 48 31 42 53', '+33 1 48 31 42 54', 'service@helios.example', strftime('%s', '2025-01-04') * 1000, strftime('%s', '2025-01-04') * 1000),
  (4, 'Claire Dubois', NULL, NULL, 'agent', '+33 6 10 20 30 40', NULL, 'claire.dubois@example', strftime('%s', '2025-01-05') * 1000, strftime('%s', '2025-01-05') * 1000),
  (5, 'Marc Bernard', NULL, NULL, 'broker', '+33 6 20 30 40 50', NULL, 'marc.bernard@example', strftime('%s', '2025-01-06') * 1000, strftime('%s', '2025-01-06') * 1000),
  (6, 'Sophie Martin', NULL, NULL, 'agent', '+33 6 30 40 50 60', NULL, 'sophie.martin@example', strftime('%s', '2025-01-07') * 1000, strftime('%s', '2025-01-07') * 1000);

INSERT OR IGNORE INTO insurance_clients
  (id, label, name, sector, phone, fax, email, created_at, updated_at)
VALUES
  (1, 'BatiNord Construction', 'BatiNord Construction SAS', 'Construction', '+33 3 20 10 11 12', NULL, 'hr@batinord.example', strftime('%s', '2025-01-10') * 1000, strftime('%s', '2025-01-10') * 1000),
  (2, 'MetroLogistics', 'MetroLogistics France', 'Transport and logistics', '+33 1 55 22 33 44', '+33 1 55 22 33 45', 'workplace@metrologistics.example', strftime('%s', '2025-01-11') * 1000, strftime('%s', '2025-01-11') * 1000),
  (3, 'GreenField Foods', 'GreenField Foods SARL', 'Food processing', '+33 4 72 10 20 30', NULL, 'admin@greenfield.example', strftime('%s', '2025-01-12') * 1000, strftime('%s', '2025-01-12') * 1000),
  (4, 'Lumen Hotels', 'Lumen Hotels Group', 'Hospitality', '+33 1 70 40 50 60', NULL, 'people@lumenhotels.example', strftime('%s', '2025-01-13') * 1000, strftime('%s', '2025-01-13') * 1000),
  (5, 'Riviera Manufacturing', 'Riviera Manufacturing SAS', 'Manufacturing', '+33 4 91 60 70 80', '+33 4 91 60 70 81', 'safety@rivieramfg.example', strftime('%s', '2025-01-14') * 1000, strftime('%s', '2025-01-14') * 1000),
  (6, 'CivicWorks Services', 'CivicWorks Services', 'Public services', '+33 1 60 70 80 90', NULL, 'operations@civicworks.example', strftime('%s', '2025-01-15') * 1000, strftime('%s', '2025-01-15') * 1000),
  (7, 'Alpine Energy', 'Alpine Energy France', 'Energy', '+33 4 50 10 20 30', NULL, 'safety@alpineenergy.example', strftime('%s', '2025-01-16') * 1000, strftime('%s', '2025-01-16') * 1000),
  (8, 'Orchard Retail', 'Orchard Retail SAS', 'Retail', '+33 2 40 30 20 10', NULL, 'hr@orchardretail.example', strftime('%s', '2025-01-17') * 1000, strftime('%s', '2025-01-17') * 1000);

INSERT OR IGNORE INTO service_providers
  (id, label, name, profile, worker_name, phone, fax, email, created_at, updated_at)
VALUES
  (1, 'Urgence Ambulance Lille', 'Urgence Ambulance Lille', 'ambulance', 'Paul Lefevre', '+33 3 20 11 22 33', NULL, 'dispatch@ual.example', strftime('%s', '2025-01-20') * 1000, strftime('%s', '2025-01-20') * 1000),
  (2, 'Cabinet Dr Moreau', 'Cabinet Medical Moreau', 'general practitioner', 'Dr Elise Moreau', '+33 3 20 44 55 66', NULL, 'contact@drmoreau.example', strftime('%s', '2025-01-21') * 1000, strftime('%s', '2025-01-21') * 1000),
  (3, 'Clinique Saint Pierre', 'Clinique Saint Pierre', 'emergency physician', 'Dr Karim Haddad', '+33 1 45 60 70 80', '+33 1 45 60 70 81', 'urgences@saintpierre.example', strftime('%s', '2025-01-22') * 1000, strftime('%s', '2025-01-22') * 1000),
  (4, 'Centre Respiratoire Lyon', 'Centre Respiratoire Lyon', 'resuscitator', 'Dr Alice Perrin', '+33 4 72 80 90 00', NULL, 'secretariat@crlyon.example', strftime('%s', '2025-01-23') * 1000, strftime('%s', '2025-01-23') * 1000),
  (5, 'DiabetoCare Marseille', 'DiabetoCare Marseille', 'diabetologist', 'Dr Thomas Roux', '+33 4 91 10 20 30', NULL, 'care@diabetocare.example', strftime('%s', '2025-01-24') * 1000, strftime('%s', '2025-01-24') * 1000);

INSERT OR IGNORE INTO insurance_policies
  (id, policy_number, client_company_id, effective_date, insurance_company_id, intermediate_id, terminated, termination_date, type, created_at, updated_at)
VALUES
  (1, 'AT-BATI-2025-001', 1, strftime('%s', '2025-01-01') * 1000, 1, 4, 0, NULL, 'revisable', strftime('%s', '2025-01-02') * 1000, strftime('%s', '2025-01-02') * 1000),
  (2, 'NS-METRO-2025-014', 2, strftime('%s', '2025-01-01') * 1000, 2, 5, 0, NULL, 'fixed-rate', strftime('%s', '2025-01-03') * 1000, strftime('%s', '2025-01-03') * 1000),
  (3, 'HE-GREEN-2025-022', 3, strftime('%s', '2025-01-01') * 1000, 3, 6, 0, NULL, 'revisable', strftime('%s', '2025-01-04') * 1000, strftime('%s', '2025-01-04') * 1000),
  (4, 'AT-LUMEN-2024-008', 4, strftime('%s', '2024-01-01') * 1000, 1, NULL, 1, strftime('%s', '2024-12-31') * 1000, 'fixed-rate', strftime('%s', '2024-01-02') * 1000, strftime('%s', '2024-12-31') * 1000),
  (5, 'NS-LUMEN-2025-009', 4, strftime('%s', '2025-01-01') * 1000, 2, 5, 0, NULL, 'revisable', strftime('%s', '2025-01-05') * 1000, strftime('%s', '2025-01-05') * 1000),
  (6, 'HE-RIVIERA-2025-031', 5, strftime('%s', '2025-01-01') * 1000, 3, 4, 0, NULL, 'fixed-rate', strftime('%s', '2025-01-06') * 1000, strftime('%s', '2025-01-06') * 1000),
  (7, 'AT-CIVIC-2025-041', 6, strftime('%s', '2025-01-01') * 1000, 1, 6, 0, NULL, 'revisable', strftime('%s', '2025-01-07') * 1000, strftime('%s', '2025-01-07') * 1000),
  (8, 'NS-ALPINE-2025-052', 7, strftime('%s', '2025-01-01') * 1000, 2, 5, 0, NULL, 'fixed-rate', strftime('%s', '2025-01-08') * 1000, strftime('%s', '2025-01-08') * 1000),
  (9, 'HE-ORCHARD-2025-063', 8, strftime('%s', '2025-01-01') * 1000, 3, NULL, 0, NULL, 'revisable', strftime('%s', '2025-01-09') * 1000, strftime('%s', '2025-01-09') * 1000);

INSERT OR IGNORE INTO medical_records
  (id, accident_date, policy_id, insurance_company_id, reference_number, client_company_id, record_type, reporting_date, reporter_first_name, reporter_last_name, reporter_phone, accident_type, initial_accident_id, accident_place, victim_first_name, victim_last_name, victim_national_id, victim_phone, accident_cause, record_status, record_fate, fate_reason, intermediate_id, managed_by, created_at, updated_at)
VALUES
  (1, strftime('%s', '2025-02-03 08:20') * 1000, 1, 1, 'AT/250203/001', 1, 'normal', strftime('%s', '2025-02-03 08:42') * 1000, 'Nadia', 'Petit', '+33 6 11 22 33 44', 'initial', NULL, 'site', 'Julien', 'Marchand', 'FR-1984-001', '+33 6 44 55 66 77', 'falling or slipping', 'closed', 'approved', NULL, 4, 'Claire Dubois', strftime('%s', '2025-02-03 08:42') * 1000, strftime('%s', '2025-02-05 16:10') * 1000),
  (2, strftime('%s', '2025-02-11 14:15') * 1000, 2, 2, 'NS/250211/001', 2, 'normal', strftime('%s', '2025-02-11 14:27') * 1000, 'Olivier', 'Robert', '+33 6 22 33 44 55', 'initial', NULL, 'route', 'Maya', 'Fontaine', 'FR-1991-002', '+33 6 55 66 77 88', 'moving objects', 'settled', 'approved', NULL, 5, 'Marc Bernard', strftime('%s', '2025-02-11 14:27') * 1000, strftime('%s', '2025-02-14 11:30') * 1000),
  (3, strftime('%s', '2025-02-19 09:05') * 1000, 3, 3, 'HE/250219/001', 3, 'normal', strftime('%s', '2025-02-19 09:18') * 1000, 'Camille', 'Roy', '+33 6 33 44 55 66', 'initial', NULL, 'workshop', 'Hugo', 'Leroy', 'FR-1978-003', NULL, 'machine or equipment', 'in progress', 'waiting', NULL, 6, 'Sophie Martin', strftime('%s', '2025-02-19 09:18') * 1000, strftime('%s', '2025-02-19 12:45') * 1000),
  (4, strftime('%s', '2025-03-02 17:40') * 1000, 5, 2, 'NS/250302/001', 4, 'normal', strftime('%s', '2025-03-02 17:55') * 1000, 'Luc', 'Garnier', '+33 6 44 55 66 77', 'initial', NULL, 'office', 'Sarah', 'Collet', 'FR-1989-004', '+33 6 66 77 88 99', 'overexertion and fatigue', 'closed', 'approved', NULL, 5, 'Marc Bernard', strftime('%s', '2025-03-02 17:55') * 1000, strftime('%s', '2025-03-06 10:00') * 1000),
  (5, strftime('%s', '2025-03-15 11:10') * 1000, 6, 3, 'HE/250315/001', 5, 'normal', strftime('%s', '2025-03-15 11:21') * 1000, 'Amina', 'Diallo', '+33 6 55 66 77 88', 'initial', NULL, 'site', 'Victor', 'Rossi', 'FR-1995-005', '+33 6 77 88 99 00', 'hazardous substance', 'billable', 'waiting', NULL, 4, 'Claire Dubois', strftime('%s', '2025-03-15 11:21') * 1000, strftime('%s', '2025-03-16 15:20') * 1000),
  (6, strftime('%s', '2025-04-01 07:50') * 1000, 7, 1, 'AT/250401/001', 6, 'normal', strftime('%s', '2025-04-01 08:03') * 1000, 'Louis', 'Meyer', '+33 6 66 77 88 99', 'initial', NULL, 'route', 'Emma', 'Noel', 'FR-1987-006', '+33 6 88 99 00 11', 'workplace violence', 'abandoned', 'rejected', 'absent coverage', 6, 'Sophie Martin', strftime('%s', '2025-04-01 08:03') * 1000, strftime('%s', '2025-04-02 09:15') * 1000),
  (7, strftime('%s', '2025-04-18 16:25') * 1000, 8, 2, 'NS/250418/001', 7, 'normal', strftime('%s', '2025-04-18 16:44') * 1000, 'Ines', 'Carpentier', '+33 6 77 88 99 00', 'initial', NULL, 'site', 'Marc', 'Faure', 'FR-1982-007', NULL, 'falling or slipping', 'in progress', 'waiting', NULL, 5, 'Marc Bernard', strftime('%s', '2025-04-18 16:44') * 1000, strftime('%s', '2025-04-18 18:00') * 1000),
  (8, strftime('%s', '2025-05-06 10:30') * 1000, 9, 3, 'HE/250506/001', 8, 'normal', strftime('%s', '2025-05-06 10:48') * 1000, 'Paul', 'Andre', '+33 6 88 99 00 11', 'initial', NULL, 'workshop', 'Lea', 'Vidal', 'FR-1993-008', '+33 6 99 00 11 22', 'moving objects', 'settled', 'approved', NULL, NULL, 'Sophie Martin', strftime('%s', '2025-05-06 10:48') * 1000, strftime('%s', '2025-05-10 14:10') * 1000),
  (9, strftime('%s', '2025-05-21 13:00') * 1000, 1, 1, 'AT/250521/001', 1, 'verification', strftime('%s', '2025-05-21 13:11') * 1000, 'Nadia', 'Petit', '+33 6 11 22 33 44', 'relapse', 1, 'site', 'Julien', 'Marchand', 'FR-1984-001', '+33 6 44 55 66 77', 'overexertion and fatigue', 'in progress', 'waiting', NULL, 4, 'Claire Dubois', strftime('%s', '2025-05-21 13:11') * 1000, strftime('%s', '2025-05-21 14:30') * 1000),
  (10, strftime('%s', '2025-06-03 08:45') * 1000, 2, 2, 'NS/250603/001', 2, 'normal', strftime('%s', '2025-06-03 09:00') * 1000, 'Olivier', 'Robert', '+33 6 22 33 44 55', 'sickness', NULL, 'office', 'Theo', 'Lemoine', 'FR-1990-010', NULL, NULL, 'closed', 'approved', NULL, 5, 'Marc Bernard', strftime('%s', '2025-06-03 09:00') * 1000, strftime('%s', '2025-06-08 10:40') * 1000),
  (11, strftime('%s', '2025-06-17 15:20') * 1000, 3, 3, 'HE/250617/001', 3, 'normal', strftime('%s', '2025-06-17 15:36') * 1000, 'Camille', 'Roy', '+33 6 33 44 55 66', 'initial', NULL, 'workshop', 'Nora', 'Benoit', 'FR-1986-011', '+33 6 10 20 30 40', 'machine or equipment', 'billable', 'approved', NULL, 6, 'Sophie Martin', strftime('%s', '2025-06-17 15:36') * 1000, strftime('%s', '2025-06-18 09:20') * 1000),
  (12, strftime('%s', '2025-07-04 12:05') * 1000, 5, 2, 'NS/250704/001', 4, 'normal', strftime('%s', '2025-07-04 12:18') * 1000, 'Luc', 'Garnier', '+33 6 44 55 66 77', 'initial', NULL, 'route', 'Amir', 'Blanc', 'FR-1992-012', '+33 6 20 30 40 50', 'falling or slipping', 'in progress', 'waiting', NULL, 5, 'Marc Bernard', strftime('%s', '2025-07-04 12:18') * 1000, strftime('%s', '2025-07-04 13:00') * 1000),
  (13, strftime('%s', '2025-07-22 09:35') * 1000, 6, 3, 'HE/250722/001', 5, 'normal', strftime('%s', '2025-07-22 09:46') * 1000, 'Amina', 'Diallo', '+33 6 55 66 77 88', 'initial', NULL, 'site', 'Eva', 'Marin', 'FR-1988-013', NULL, 'hazardous substance', 'closed', 'approved', NULL, 4, 'Claire Dubois', strftime('%s', '2025-07-22 09:46') * 1000, strftime('%s', '2025-07-28 16:45') * 1000),
  (14, strftime('%s', '2025-08-08 18:10') * 1000, 7, 1, 'AT/250808/001', 6, 'normal', strftime('%s', '2025-08-08 18:25') * 1000, 'Louis', 'Meyer', '+33 6 66 77 88 99', 'initial', NULL, 'office', 'Yanis', 'Henry', 'FR-1994-014', '+33 6 30 40 50 60', 'workplace violence', 'in progress', 'waiting', NULL, 6, 'Sophie Martin', strftime('%s', '2025-08-08 18:25') * 1000, strftime('%s', '2025-08-08 19:10') * 1000),
  (15, strftime('%s', '2025-08-27 06:55') * 1000, 8, 2, 'NS/250827/001', 7, 'normal', strftime('%s', '2025-08-27 07:08') * 1000, 'Ines', 'Carpentier', '+33 6 77 88 99 00', 'initial', NULL, 'route', 'Clara', 'Pons', 'FR-1981-015', '+33 6 40 50 60 70', 'moving objects', 'settled', 'approved', NULL, 5, 'Marc Bernard', strftime('%s', '2025-08-27 07:08') * 1000, strftime('%s', '2025-09-01 11:20') * 1000),
  (16, strftime('%s', '2025-09-03 11:40') * 1000, 9, 3, 'HE/250903/001', 8, 'normal', strftime('%s', '2025-09-03 11:55') * 1000, 'Paul', 'Andre', '+33 6 88 99 00 11', 'initial', NULL, 'workshop', 'Mila', 'Giraud', 'FR-1996-016', NULL, 'falling or slipping', 'in progress', 'waiting', NULL, NULL, 'Sophie Martin', strftime('%s', '2025-09-03 11:55') * 1000, strftime('%s', '2025-09-03 13:00') * 1000),
  (17, strftime('%s', '2025-09-12 14:20') * 1000, 1, 1, 'AT/250912/001', 1, 'normal', strftime('%s', '2025-09-12 14:32') * 1000, 'Nadia', 'Petit', '+33 6 11 22 33 44', 'initial', NULL, 'site', 'Romain', 'Perrot', 'FR-1980-017', '+33 6 50 60 70 80', 'machine or equipment', 'abandoned', 'abandoned', 'cancelled policy', 4, 'Claire Dubois', strftime('%s', '2025-09-12 14:32') * 1000, strftime('%s', '2025-09-13 10:10') * 1000),
  (18, strftime('%s', '2025-09-25 16:05') * 1000, 2, 2, 'NS/250925/001', 2, 'normal', strftime('%s', '2025-09-25 16:17') * 1000, 'Olivier', 'Robert', '+33 6 22 33 44 55', 'initial', NULL, 'route', 'Anais', 'Marchal', 'FR-1997-018', '+33 6 60 70 80 90', 'overexertion and fatigue', 'in progress', 'waiting', NULL, 5, 'Marc Bernard', strftime('%s', '2025-09-25 16:17') * 1000, strftime('%s', '2025-09-25 17:05') * 1000),
  (19, strftime('%s', '2025-10-06 10:15') * 1000, 3, 3, 'HE/251006/001', 3, 'normal', strftime('%s', '2025-10-06 10:27') * 1000, 'Camille', 'Roy', '+33 6 33 44 55 66', 'initial', NULL, 'workshop', 'Leo', 'Gillet', 'FR-1985-019', '+33 6 70 80 90 00', 'hazardous substance', 'billable', 'waiting', NULL, 6, 'Sophie Martin', strftime('%s', '2025-10-06 10:27') * 1000, strftime('%s', '2025-10-06 11:45') * 1000),
  (20, strftime('%s', '2025-10-19 08:30') * 1000, 5, 2, 'NS/251019/001', 4, 'normal', strftime('%s', '2025-10-19 08:42') * 1000, 'Luc', 'Garnier', '+33 6 44 55 66 77', 'initial', NULL, 'office', 'Maeva', 'Picard', 'FR-1998-020', '+33 6 80 90 00 11', 'falling or slipping', 'closed', 'approved', NULL, 5, 'Marc Bernard', strftime('%s', '2025-10-19 08:42') * 1000, strftime('%s', '2025-10-24 15:30') * 1000);

INSERT OR IGNORE INTO medical_services
  (id, medical_record_id, service, provider_id, mission_date, mission_place, observations, settled, created_at, updated_at)
VALUES
  (1, 1, 'Emergency transport', 1, strftime('%s', '2025-02-03 09:00') * 1000, 'BatiNord construction site', 'Patient transported for wrist examination.', 1, strftime('%s', '2025-02-03 09:00') * 1000, strftime('%s', '2025-02-03 12:00') * 1000),
  (2, 1, 'General practitioner consultation', 2, strftime('%s', '2025-02-04 10:30') * 1000, 'Cabinet Medical Moreau', 'Minor fracture ruled out after imaging.', 1, strftime('%s', '2025-02-04 10:30') * 1000, strftime('%s', '2025-02-04 16:00') * 1000),
  (3, 2, 'Emergency transport', 1, strftime('%s', '2025-02-11 15:00') * 1000, 'MetroLogistics depot', 'Lower back pain after loading incident.', 1, strftime('%s', '2025-02-11 15:00') * 1000, strftime('%s', '2025-02-12 09:00') * 1000),
  (4, 3, 'Emergency physician consultation', 3, strftime('%s', '2025-02-19 10:00') * 1000, 'Clinique Saint Pierre', 'Hand injury requires follow-up imaging.', 0, strftime('%s', '2025-02-19 10:00') * 1000, strftime('%s', '2025-02-19 10:00') * 1000),
  (5, 4, 'General practitioner consultation', 2, strftime('%s', '2025-03-03 09:00') * 1000, 'Cabinet Medical Moreau', 'Rest prescribed for three days.', 1, strftime('%s', '2025-03-03 09:00') * 1000, strftime('%s', '2025-03-06 10:00') * 1000),
  (6, 5, 'Emergency transport', 1, strftime('%s', '2025-03-15 11:45') * 1000, 'Riviera Manufacturing site', 'Decontamination completed before transport.', 0, strftime('%s', '2025-03-15 11:45') * 1000, strftime('%s', '2025-03-15 12:30') * 1000),
  (7, 7, 'Emergency transport', 1, strftime('%s', '2025-04-18 17:00') * 1000, 'Alpine Energy route depot', 'Knee injury assessed on site.', 0, strftime('%s', '2025-04-18 17:00') * 1000, strftime('%s', '2025-04-18 17:00') * 1000),
  (8, 9, 'General practitioner consultation', 2, strftime('%s', '2025-05-22 14:00') * 1000, 'Cabinet Medical Moreau', 'Follow-up consultation for recurring pain.', 0, strftime('%s', '2025-05-22 14:00') * 1000, strftime('%s', '2025-05-22 14:00') * 1000),
  (9, 10, 'Emergency physician consultation', 3, strftime('%s', '2025-06-03 10:00') * 1000, 'Clinique Saint Pierre', 'Medical certificate issued.', 1, strftime('%s', '2025-06-03 10:00') * 1000, strftime('%s', '2025-06-08 10:40') * 1000),
  (10, 11, 'Respiratory assessment', 4, strftime('%s', '2025-06-18 10:00') * 1000, 'Centre Respiratoire Lyon', 'Exposure symptoms under observation.', 0, strftime('%s', '2025-06-18 10:00') * 1000, strftime('%s', '2025-06-18 10:00') * 1000),
  (11, 12, 'Emergency transport', 1, strftime('%s', '2025-07-04 12:45') * 1000, 'Lumen Hotels loading area', 'Ankle injury transferred for examination.', 0, strftime('%s', '2025-07-04 12:45') * 1000, strftime('%s', '2025-07-04 13:00') * 1000),
  (12, 13, 'Emergency physician consultation', 3, strftime('%s', '2025-07-22 10:30') * 1000, 'Clinique Saint Pierre', 'Treatment completed without complication.', 1, strftime('%s', '2025-07-22 10:30') * 1000, strftime('%s', '2025-07-28 16:45') * 1000),
  (13, 15, 'General practitioner consultation', 2, strftime('%s', '2025-08-28 09:30') * 1000, 'Cabinet Medical Moreau', 'Shoulder strain treated with physiotherapy referral.', 1, strftime('%s', '2025-08-28 09:30') * 1000, strftime('%s', '2025-09-01 11:20') * 1000),
  (14, 16, 'Emergency transport', 1, strftime('%s', '2025-09-03 12:00') * 1000, 'Orchard Retail shop', 'Head impact monitored for four hours.', 0, strftime('%s', '2025-09-03 12:00') * 1000, strftime('%s', '2025-09-03 13:00') * 1000),
  (15, 18, 'General practitioner consultation', 2, strftime('%s', '2025-09-26 09:00') * 1000, 'Cabinet Medical Moreau', 'Initial assessment pending employer documents.', 0, strftime('%s', '2025-09-26 09:00') * 1000, strftime('%s', '2025-09-26 09:00') * 1000),
  (16, 19, 'Diabetes consultation', 5, strftime('%s', '2025-10-07 11:00') * 1000, 'DiabetoCare Marseille', 'Blood sugar monitoring recommended.', 0, strftime('%s', '2025-10-07 11:00') * 1000, strftime('%s', '2025-10-07 11:00') * 1000),
  (17, 20, 'Emergency physician consultation', 3, strftime('%s', '2025-10-19 09:15') * 1000, 'Clinique Saint Pierre', 'No further treatment required.', 1, strftime('%s', '2025-10-19 09:15') * 1000, strftime('%s', '2025-10-24 15:30') * 1000);

INSERT OR IGNORE INTO medical_documents
  (id, medical_record_id, type, last_printed_at, observations, signed, created_at, updated_at)
VALUES
  (1, 1, 'record details', strftime('%s', '2025-02-03 09:10') * 1000, 'Initial record summary.', 1, strftime('%s', '2025-02-03 09:10') * 1000, strftime('%s', '2025-02-05 16:10') * 1000),
  (2, 1, 'coverage', strftime('%s', '2025-02-03 09:15') * 1000, 'Coverage sent to clinic.', 1, strftime('%s', '2025-02-03 09:15') * 1000, strftime('%s', '2025-02-03 09:15') * 1000),
  (3, 2, 'record details', strftime('%s', '2025-02-11 14:40') * 1000, NULL, 1, strftime('%s', '2025-02-11 14:40') * 1000, strftime('%s', '2025-02-14 11:30') * 1000),
  (4, 3, 'coverage', strftime('%s', '2025-02-19 09:30') * 1000, 'Awaiting signed treatment authorization.', 0, strftime('%s', '2025-02-19 09:30') * 1000, strftime('%s', '2025-02-19 09:30') * 1000),
  (5, 5, 'coverage', strftime('%s', '2025-03-15 12:00') * 1000, 'Decontamination and transport coverage.', 0, strftime('%s', '2025-03-15 12:00') * 1000, strftime('%s', '2025-03-15 12:30') * 1000),
  (6, 9, 'record details', strftime('%s', '2025-05-21 13:30') * 1000, 'Relapse linked to AT/250203/001.', 0, strftime('%s', '2025-05-21 13:30') * 1000, strftime('%s', '2025-05-21 14:30') * 1000),
  (7, 10, 'coverage', strftime('%s', '2025-06-03 09:20') * 1000, NULL, 1, strftime('%s', '2025-06-03 09:20') * 1000, strftime('%s', '2025-06-08 10:40') * 1000),
  (8, 11, 'record details', strftime('%s', '2025-06-17 16:00') * 1000, 'Chemical exposure report.', 0, strftime('%s', '2025-06-17 16:00') * 1000, strftime('%s', '2025-06-18 09:20') * 1000),
  (9, 13, 'coverage', strftime('%s', '2025-07-22 10:45') * 1000, NULL, 1, strftime('%s', '2025-07-22 10:45') * 1000, strftime('%s', '2025-07-28 16:45') * 1000),
  (10, 16, 'record details', strftime('%s', '2025-09-03 12:10') * 1000, 'Head impact observation instructions.', 0, strftime('%s', '2025-09-03 12:10') * 1000, strftime('%s', '2025-09-03 13:00') * 1000),
  (11, 20, 'record details', strftime('%s', '2025-10-19 09:30') * 1000, 'Final consultation summary.', 1, strftime('%s', '2025-10-19 09:30') * 1000, strftime('%s', '2025-10-24 15:30') * 1000),
  (12, 20, 'others', NULL, 'Employer incident photos pending archive.', 0, strftime('%s', '2025-10-19 09:35') * 1000, strftime('%s', '2025-10-19 09:35') * 1000);

COMMIT;