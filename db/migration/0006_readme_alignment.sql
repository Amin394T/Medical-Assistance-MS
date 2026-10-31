CREATE TABLE `medical_certificates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`type` text NOT NULL,
	`service_provider_id` integer,
	`days_number` integer NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`observation` text,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `medical_documents` RENAME TO `medical_documents_archive`;--> statement-breakpoint
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
INSERT INTO `__new_medical_records`("id", "reference", "type", "policy_id", "reporting_date", "reporter_first_name", "reporter_last_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "status", "evolution", "delegation_date", "regulatory_doctor", "managed_by", "observation", "opening_date", "last_modified") SELECT "id", "reference", "type", "policy_id", "reporting_date", "reporter_first_name", "reporter_last_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "status", "evolution", "delegation_date", NULL, "managed_by", "observation", "opening_date", "last_modified" FROM `medical_records`;--> statement-breakpoint
DROP TABLE `medical_records`;--> statement-breakpoint
ALTER TABLE `__new_medical_records` RENAME TO `medical_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_reference_unique` ON `medical_records` (`reference`);