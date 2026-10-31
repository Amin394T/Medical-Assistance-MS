ALTER TABLE `insurance_policies` RENAME COLUMN "created_at" TO "creation_date";--> statement-breakpoint
ALTER TABLE `insurance_policies` RENAME COLUMN "updated_at" TO "last_modified";--> statement-breakpoint
ALTER TABLE `medical_services` RENAME COLUMN "mission_date" TO "service_date";--> statement-breakpoint
CREATE TABLE `insurance_policy_statuses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` integer NOT NULL,
	`status` text NOT NULL,
	`effective_date` integer NOT NULL,
	`update_date` integer NOT NULL,
	`cancelled` integer DEFAULT false,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`insurance_provider_id` integer NOT NULL,
	`bank` text,
	`payment_mode` text,
	`payment_reference` text,
	`cashed` integer DEFAULT false,
	`cashing_date` integer,
	FOREIGN KEY (`insurance_provider_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `insurance_policies` DROP COLUMN `terminated`;--> statement-breakpoint
ALTER TABLE `insurance_policies` DROP COLUMN `termination_date`;--> statement-breakpoint
ALTER TABLE `insurance_policies` DROP COLUMN `nominative_list`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_medical_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` integer NOT NULL,
	`type` text DEFAULT 'AT' NOT NULL,
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
	`status` text DEFAULT 'PROG' NOT NULL,
	`fate` integer DEFAULT false,
	`evolution` text DEFAULT 'INIT' NOT NULL,
	`delegation` integer DEFAULT false,
	`delegation_date` integer,
	`coverage` integer DEFAULT false,
	`coverage_date` integer,
	`managed_by` text NOT NULL,
	`observation` text,
	`opening_date` integer NOT NULL,
	`last_modified` integer NOT NULL,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_medical_records`("id", "reference", "type", "policy_id", "reporting_date", "reporter_first_name", "reporter_last_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "status", "fate", "evolution", "delegation", "delegation_date", "coverage", "coverage_date", "managed_by", "observation", "opening_date", "last_modified") SELECT "id", "reference", "type", "policy_id", "reporting_date", "reporter_first_name", "reporter_last_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "status", "fate", "evolution", "delegation", "delegation_date", "coverage", "coverage_date", "managed_by", "observation", "created_at", "updated_at" FROM `medical_records`;--> statement-breakpoint
DROP TABLE `medical_records`;--> statement-breakpoint
ALTER TABLE `__new_medical_records` RENAME TO `medical_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_reference_unique` ON `medical_records` (`reference`);--> statement-breakpoint
ALTER TABLE `medical_services` ADD `fee_amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `billed_amount` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `tax_rate` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `billing_status` text DEFAULT 'WTN' NOT NULL;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `settling_date` integer;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `bank` text;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `payment_mode` text;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `payment_reference` text;--> statement-breakpoint
ALTER TABLE `medical_services` ADD `invoice_id` integer REFERENCES invoices(id);--> statement-breakpoint
ALTER TABLE `medical_services` DROP COLUMN `mission_place`;--> statement-breakpoint
ALTER TABLE `insurance_providers` ADD `balance` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `service_providers` ADD `bank` text;--> statement-breakpoint
ALTER TABLE `service_providers` ADD `bank_account` text;--> statement-breakpoint
ALTER TABLE `service_types` ADD `default_fee` real DEFAULT 0 NOT NULL;