PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `insurance_providers_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`phone` text,
	`email` text
);--> statement-breakpoint
CREATE TABLE `insurance_policies_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_number` text NOT NULL,
	`client_company` text NOT NULL,
	`client_activity` text,
	`client_address` text,
	`client_city` text,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`status_date` integer NOT NULL,
	`upload_date` integer NOT NULL,
	`insurance_provider_id` integer NOT NULL,
	FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `insurance_coverages_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` integer NOT NULL,
	`employee` text NOT NULL,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies_new`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE TABLE `insurance_commissions_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_id` integer NOT NULL,
	`record_type` text NOT NULL,
	`commission` real NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `invoice_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` integer NOT NULL,
	`insurance_provider_id` integer NOT NULL,
	`request_date` integer NOT NULL,
	`total_amount` real NOT NULL,
	`payment_mode` text,
	`payment_reference` text,
	`bank` text,
	`collected` integer DEFAULT false,
	`collection_date` integer,
	FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `invoice_settlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` integer NOT NULL,
	`service_provider_id` integer NOT NULL,
	`reception_date` integer,
	`total_amount` real NOT NULL,
	`payment_mode` text,
	`payment_reference` text,
	`bank` text,
	`settled` integer DEFAULT false,
	`settlement_date` integer,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `billing_invoices_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`reference` integer NOT NULL,
	`issue_date` integer NOT NULL,
	`total_amount` real NOT NULL,
	`collection_id` integer,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collection_id`) REFERENCES `invoice_collections`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `service_providers_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`profile` text NOT NULL,
	`contact_name` text,
	`phone` text NOT NULL,
	`email` text
);--> statement-breakpoint
CREATE TABLE `service_types_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`payment_amount` real NOT NULL,
	`billing_amount` real NOT NULL,
	`tax_rate` real NOT NULL,
	`target_profile` text NOT NULL
);--> statement-breakpoint
CREATE TABLE `medical_records_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` integer NOT NULL,
	`policy_id` integer NOT NULL,
	`reporting_date` integer NOT NULL,
	`reporter_name` text,
	`reporter_phone` text,
	`accident_date` integer NOT NULL,
	`accident_type` text NOT NULL,
	`accident_place` text,
	`accident_cause` text,
	`accident_evolution` text NOT NULL,
	`victim_first_name` text,
	`victim_last_name` text,
	`victim_phone` text,
	`victim_national_id` text,
	`victim_job` text,
	`status` text NOT NULL,
	`status_reason` text,
	`regulatory_doctor` text,
	`manager` text NOT NULL,
	`observation` text,
	`last_updated` integer NOT NULL,
	`last_updater` text NOT NULL,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `medical_services_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`service_provider_id` integer NOT NULL,
	`service_type_id` integer NOT NULL,
	`date` integer NOT NULL,
	`observation` text,
	`invoice_id` integer,
	`settlement_id` integer,
	`place` text,
	`payment_amount` real NOT NULL,
	`billing_amount` real NOT NULL,
	`tax_rate` real NOT NULL,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `billing_invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`settlement_id`) REFERENCES `invoice_settlements`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `medical_certificates_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`type` text NOT NULL,
	`service_provider_id` integer,
	`compensation_rate` real,
	`day_count` integer NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`observation` text,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `insurance_providers_new` (`id`, `label`, `phone`, `email`)
SELECT `id`, `label`, `phone`, `email` FROM `insurance_providers`;--> statement-breakpoint
INSERT INTO `insurance_policies_new` (
	`id`, `policy_number`, `client_company`, `client_activity`, `client_address`, `client_city`,
	`type`, `status`, `status_date`, `upload_date`, `insurance_provider_id`
)
SELECT `id`, `policy_number`, `client_company`, `client_activity`, `client_address`, `client_city`,
	CASE `type` WHEN 'FIX' THEN 'NMT' ELSE 'GLB' END,
	CASE `status` WHEN 'VALI' THEN 'VLD' WHEN 'SUSP' THEN 'SPD' WHEN 'TERM' THEN 'TRM' ELSE `status` END,
	`effective_date`, `creation_date`, `insurance_company_id`
FROM `insurance_policies`;--> statement-breakpoint
INSERT INTO `insurance_coverages_new` (`id`, `policy_id`, `employee`)
SELECT `id`, `policy_id`, `employee` FROM `insurance_policy_employees`;--> statement-breakpoint
INSERT INTO `service_providers_new` (`id`, `label`, `profile`, `contact_name`, `phone`, `email`)
SELECT `id`, `label`, `profile`, `contact_name`, `phone`, `email` FROM `service_providers`;--> statement-breakpoint
INSERT INTO `service_types_new` (`id`, `label`, `payment_amount`, `billing_amount`, `tax_rate`, `target_profile`)
SELECT `id`, `label`, `payment_amount`, `billing_amount`, `tax_rate`, `target_profile` FROM `service_types`;--> statement-breakpoint
INSERT INTO `medical_records_new` (
	`id`, `reference`, `policy_id`, `reporting_date`, `reporter_name`, `reporter_phone`, `accident_date`,
	`accident_type`, `accident_place`, `accident_cause`, `accident_evolution`, `victim_first_name`,
	`victim_last_name`, `victim_phone`, `victim_national_id`, `victim_job`, `status`, `status_reason`,
	`regulatory_doctor`, `manager`, `observation`, `last_updated`, `last_updater`
)
SELECT `id`, `reference`, `policy_id`, `reporting_date`, `reporter_name`, `reporter_phone`, `accident_date`,
	CASE `accident_type` WHEN 'VF' THEN 'VP' WHEN 'PR' THEN 'MP' ELSE `accident_type` END,
	CASE `accident_place` WHEN 'WS' THEN 'WKS' WHEN 'RT' THEN 'RUT' WHEN 'OF' THEN 'OFC' WHEN 'CT' THEN 'CST' ELSE `accident_place` END,
	CASE `accident_cause` WHEN 'FALL' THEN 'FAL' WHEN 'EQIP' THEN 'EQP' WHEN 'FATG' THEN 'FTG' WHEN 'HAZD' THEN 'HZD' WHEN 'VIOL' THEN 'VLC' WHEN 'OBJC' THEN 'OBJ' ELSE `accident_cause` END,
	CASE `accident_evolution` WHEN 'INIT' THEN 'INT' WHEN 'RELP' THEN 'RLP' WHEN 'DEAT' THEN 'DTH' WHEN 'COMP' THEN 'CMP' ELSE `accident_evolution` END,
	`victim_first_name`, `victim_last_name`, `victim_phone`, `victim_national_id`, `victim_job`, `status`,
	CASE `status_reason` WHEN 'SUS' THEN 'SPD' WHEN 'TER' THEN 'TRM' WHEN 'COV' THEN 'LMT' ELSE `status_reason` END,
	`regulatory_doctor`, `manager`, `observation`, `last_updated`, `last_updater`
FROM `medical_records`;--> statement-breakpoint
INSERT INTO `medical_certificates_new` (
	`id`, `medical_record_id`, `type`, `service_provider_id`, `compensation_rate`, `day_count`,
	`start_date`, `end_date`, `observation`
)
SELECT `id`, `medical_record_id`, `type`, `service_provider_id`, NULL, `day_count`,
	`start_date`, `end_date`, `observation` FROM `medical_certificates`;--> statement-breakpoint
INSERT INTO `invoice_collections` (
	`id`, `reference`, `insurance_provider_id`, `request_date`, `total_amount`, `payment_mode`,
	`payment_reference`, `bank`, `collected`, `collection_date`
)
SELECT `id`,
	CAST(substr(strftime('%Y%m', 'now'), 3, 4) || printf('%04d', `id`) AS INTEGER),
	`insurance_provider_id`, `request_date`, `total_amount`, `payment_mode`,
	`payment_reference`, `bank`, `cashed`, `cashing_date`
FROM `billing_cashings`;--> statement-breakpoint
INSERT INTO `billing_invoices_new` (
	`id`, `medical_record_id`, `reference`, `issue_date`, `total_amount`, `collection_id`
)
SELECT `id`, `medical_record_id`, `reference`, `issue_date`, `total_amount`, `cashing_id`
FROM `billing_invoices`;--> statement-breakpoint
INSERT INTO `invoice_settlements` (
	`id`, `reference`, `service_provider_id`, `reception_date`, `total_amount`, `payment_mode`,
	`payment_reference`, `bank`, `settled`, `settlement_date`
)
SELECT `id`,
	CAST(substr(strftime('%Y%m', 'now'), 3, 4) || printf('%04d', `id`) AS INTEGER),
	`service_provider_id`, COALESCE(`settling_date`, `date`, CAST(strftime('%s', 'now') AS INTEGER)),
	`payment_amount`, `payment_mode`, `payment_reference`, `bank`, 1, `settling_date`
FROM `medical_services` WHERE `settlement_status` = 'SETT';--> statement-breakpoint
INSERT INTO `medical_services_new` (
	`id`, `medical_record_id`, `service_provider_id`, `service_type_id`, `date`, `observation`,
	`invoice_id`, `settlement_id`, `place`, `payment_amount`, `billing_amount`, `tax_rate`
)
SELECT `id`, `medical_record_id`, `service_provider_id`, `service_type_id`,
	COALESCE(`date`, CAST(strftime('%s', 'now') AS INTEGER)), `observation`, `invoice_id`,
	CASE WHEN `settlement_status` = 'SETT' THEN `id` ELSE NULL END, NULL,
	`payment_amount`, `billing_amount`, `tax_rate`
FROM `medical_services`;--> statement-breakpoint
DROP TABLE `medical_services`;--> statement-breakpoint
DROP TABLE `medical_certificates`;--> statement-breakpoint
DROP TABLE `billing_invoices`;--> statement-breakpoint
DROP TABLE `billing_cashings`;--> statement-breakpoint
DROP TABLE `medical_records`;--> statement-breakpoint
DROP TABLE `insurance_policy_employees`;--> statement-breakpoint
DROP TABLE `insurance_policies`;--> statement-breakpoint
DROP TABLE `service_providers`;--> statement-breakpoint
DROP TABLE `service_types`;--> statement-breakpoint
DROP TABLE `insurance_providers`;--> statement-breakpoint
ALTER TABLE `insurance_providers_new` RENAME TO `insurance_providers`;--> statement-breakpoint
ALTER TABLE `insurance_policies_new` RENAME TO `insurance_policies`;--> statement-breakpoint
ALTER TABLE `insurance_coverages_new` RENAME TO `insurance_coverages`;--> statement-breakpoint
ALTER TABLE `insurance_commissions_new` RENAME TO `insurance_commissions`;--> statement-breakpoint
ALTER TABLE `billing_invoices_new` RENAME TO `billing_invoices`;--> statement-breakpoint
ALTER TABLE `service_providers_new` RENAME TO `service_providers`;--> statement-breakpoint
ALTER TABLE `service_types_new` RENAME TO `service_types`;--> statement-breakpoint
ALTER TABLE `medical_records_new` RENAME TO `medical_records`;--> statement-breakpoint
ALTER TABLE `medical_services_new` RENAME TO `medical_services`;--> statement-breakpoint
ALTER TABLE `medical_certificates_new` RENAME TO `medical_certificates`;--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_providers_label_unique` ON `insurance_providers` (`label`);--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_policies_policy_number_unique` ON `insurance_policies` (`policy_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_coverages_policy_employee_unique` ON `insurance_coverages` (`policy_id`, `employee`);--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_commissions_provider_record_type_unique` ON `insurance_commissions` (`provider_id`, `record_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_collections_reference_unique` ON `invoice_collections` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_settlements_reference_unique` ON `invoice_settlements` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_invoices_reference_unique` ON `billing_invoices` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `service_providers_label_unique` ON `service_providers` (`label`);--> statement-breakpoint
CREATE UNIQUE INDEX `service_types_label_unique` ON `service_types` (`label`);--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_reference_unique` ON `medical_records` (`reference`);--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;
