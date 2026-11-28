CREATE TABLE `billing_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`reference` integer NOT NULL,
	`issue_date` integer NOT NULL,
	`total_amount` real NOT NULL,
	`collection_id` integer,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`collection_id`) REFERENCES `invoice_collections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_invoices_reference_unique` ON `billing_invoices` (`reference`);--> statement-breakpoint
CREATE TABLE `insurance_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`phone` text,
	`email` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_providers_label_unique` ON `insurance_providers` (`label`);--> statement-breakpoint
CREATE TABLE `insurance_policies` (
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
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_policies_policy_number_unique` ON `insurance_policies` (`policy_number`);--> statement-breakpoint
CREATE TABLE `insurance_coverages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` integer NOT NULL,
	`employee` text NOT NULL,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_coverages_policy_employee_unique` ON `insurance_coverages` (`policy_id`,`employee`);--> statement-breakpoint
CREATE TABLE `insurance_commissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_id` integer NOT NULL,
	`record_type` text NOT NULL,
	`commission` real NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_commissions_provider_record_type_unique` ON `insurance_commissions` (`provider_id`,`record_type`);--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_collections_reference_unique` ON `invoice_collections` (`reference`);--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_settlements_reference_unique` ON `invoice_settlements` (`reference`);--> statement-breakpoint
CREATE TABLE `service_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`profile` text NOT NULL,
	`contact_name` text,
	`phone` text NOT NULL,
	`email` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_providers_label_unique` ON `service_providers` (`label`);--> statement-breakpoint
CREATE TABLE `service_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`payment_amount` real NOT NULL,
	`billing_amount` real NOT NULL,
	`tax_rate` real NOT NULL,
	`target_profile` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_types_label_unique` ON `service_types` (`label`);--> statement-breakpoint
CREATE TABLE `medical_records` (
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
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_reference_unique` ON `medical_records` (`reference`);--> statement-breakpoint
CREATE TABLE `medical_services` (
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
);
--> statement-breakpoint
CREATE TABLE `medical_certificates` (
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
);
