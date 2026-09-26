CREATE TABLE `insurance_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`corporate_name` text,
	`corporate_id` text,
	`type` text NOT NULL,
	`phone` text,
	`email` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_providers_label_unique` ON `insurance_providers` (`label`);--> statement-breakpoint
CREATE TABLE `insurance_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_number` text NOT NULL,
	`client_company` text NOT NULL,
	`effective_date` integer NOT NULL,
	`insurance_company_id` integer NOT NULL,
	`intermediate_id` integer,
	`terminated` integer DEFAULT false,
	`termination_date` integer,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`intermediate_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`corporate_name` text,
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
	`target_profile` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `medical_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text NOT NULL,
	`record_type` text DEFAULT 'AT' NOT NULL,
	`policy_id` integer NOT NULL,
	`reporting_date` integer NOT NULL,
	`reporter_first_name` text NOT NULL,
	`reporter_last_name` text,
	`reporter_phone` text NOT NULL,
	`accident_place` text NOT NULL,
	`accident_date` integer NOT NULL,
	`accident_cause` text,
	`victim_first_name` text NOT NULL,
	`victim_last_name` text NOT NULL,
	`victim_phone` text,
	`victim_national_id` text NOT NULL,
	`victim_job` text,
	`accident_evolution` text DEFAULT 'INIT' NOT NULL,
	`delegation_date` integer,
	`coverage_issued` integer,
	`coverage_date` integer,
	`regulator_id` integer,
	`record_status` text DEFAULT 'PROG' NOT NULL,
	`last_action` integer NOT NULL,
	`managed_by` text DEFAULT 'USER' NOT NULL,
	`observation` text,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`regulator_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_reference_unique` ON `medical_records` (`reference`);--> statement-breakpoint
CREATE TABLE `medical_services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`service_provider_id` integer NOT NULL,
	`service_type_id` integer NOT NULL,
	`mission_date` integer,
	`mission_place` text,
	`observation` text,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medical_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`type` text NOT NULL,
	`service_provider_id` integer NOT NULL,
	`observation` text,
	`signed` integer,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);
