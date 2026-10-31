PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_insurance_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`corporate_id` text,
	`type` text NOT NULL,
	`phone` text,
	`email` text,
	`balance` real
);
--> statement-breakpoint
INSERT INTO `__new_insurance_providers`("id", "label", "corporate_id", "type", "phone", "email", "balance") SELECT "id", "label", "corporate_id", "type", "phone", "email", "balance" FROM `insurance_providers`;--> statement-breakpoint
DROP TABLE `insurance_providers`;--> statement-breakpoint
ALTER TABLE `__new_insurance_providers` RENAME TO `insurance_providers`;--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_providers_label_unique` ON `insurance_providers` (`label`);--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`total_amount` real NOT NULL,
	`insurance_provider_id` integer NOT NULL,
	`bank` text,
	`payment_mode` text,
	`payment_reference` text,
	`cashed` integer DEFAULT false,
	`cashing_date` integer,
	FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "date", "total_amount", "insurance_provider_id", "bank", "payment_mode", "payment_reference", "cashed", "cashing_date") SELECT "id", "date", "total_amount", "insurance_provider_id", "bank", "payment_mode", "payment_reference", "cashed", "cashing_date" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
CREATE TABLE `__new_medical_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` integer NOT NULL,
	`type` text DEFAULT 'AT' NOT NULL,
	`policy_id` integer NOT NULL,
	`reporting_date` integer NOT NULL,
	`reporter_name` text,
	`reporter_phone` text NOT NULL,
	`accident_place` text NOT NULL,
	`accident_date` integer NOT NULL,
	`accident_cause` text,
	`victim_first_name` text NOT NULL,
	`victim_last_name` text,
	`victim_phone` text,
	`victim_national_id` text NOT NULL,
	`victim_job` text,
	`status` text DEFAULT 'PROG' NOT NULL,
	`evolution` text DEFAULT 'INIT' NOT NULL,
	`delegation_date` integer,
	`regulatory_doctor` text,
	`managed_by` text NOT NULL,
	`observation` text,
	`opening_date` integer NOT NULL,
	`last_modified` integer NOT NULL,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_medical_records`("id", "reference", "type", "policy_id", "reporting_date", "reporter_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "status", "evolution", "delegation_date", "regulatory_doctor", "managed_by", "observation", "opening_date", "last_modified") SELECT "id", "reference", "type", "policy_id", "reporting_date", "reporter_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "status", "evolution", "delegation_date", "regulatory_doctor", "managed_by", "observation", "opening_date", "last_modified" FROM `medical_records`;--> statement-breakpoint
DROP TABLE `medical_records`;--> statement-breakpoint
ALTER TABLE `__new_medical_records` RENAME TO `medical_records`;--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_reference_unique` ON `medical_records` (`reference`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;