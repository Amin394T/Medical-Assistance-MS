CREATE TABLE `billing_cashings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`insurance_provider_id` integer NOT NULL,
	`request_date` integer NOT NULL,
	`total_amount` real NOT NULL,
	`bank` text,
	`payment_mode` text,
	`payment_reference` text,
	`cashed` integer DEFAULT false,
	`cashing_date` integer,
	FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `billing_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`reference` integer NOT NULL,
	`issue_date` integer NOT NULL,
	`total_amount` real NOT NULL,
	`cashing_id` integer,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cashing_id`) REFERENCES `billing_cashings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_invoices_reference_unique` ON `billing_invoices` (`reference`);--> statement-breakpoint
CREATE TABLE `insurance_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`corporate_id` text,
	`type` text NOT NULL,
	`phone` text,
	`email` text,
	`balance` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_providers_label_unique` ON `insurance_providers` (`label`);--> statement-breakpoint
CREATE TABLE `insurance_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_number` text NOT NULL,
	`client_company` text NOT NULL,
	`effective_date` integer NOT NULL,
	`status` text NOT NULL,
	`insurance_company_id` integer NOT NULL,
	`intermediary_id` integer,
	`creation_date` integer NOT NULL,
	`last_updated` integer NOT NULL,
	FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`intermediary_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_policies_policy_number_unique` ON `insurance_policies` (`policy_number`);--> statement-breakpoint
CREATE TABLE `service_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`corporate_name` text,
	`profile` text NOT NULL,
	`contact_name` text,
	`phone` text NOT NULL,
	`email` text,
	`bank` text,
	`bank_account` text
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
	`reporter_phone` text NOT NULL,
	`accident_date` integer NOT NULL,
	`accident_type` text NOT NULL,
	`accident_place` text NOT NULL,
	`accident_cause` text,
	`accident_evolution` text NOT NULL,
	`victim_first_name` text NOT NULL,
	`victim_last_name` text,
	`victim_phone` text,
	`victim_national_id` text NOT NULL,
	`victim_job` text,
	`status` text NOT NULL,
	`delegation_date` integer,
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
	`date` integer,
	`observation` text,
	`settlement_status` text DEFAULT 'WAIT' NOT NULL,
	`settling_date` integer,
	`invoice_id` integer,
	`payment_amount` real NOT NULL,
	`billing_amount` real NOT NULL,
	`tax_rate` real NOT NULL,
	`bank` text,
	`payment_mode` text,
	`payment_reference` text,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `billing_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medical_certificates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`type` text NOT NULL,
	`service_provider_id` integer,
	`day_count` integer NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`observation` text,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);
