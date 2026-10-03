PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_medical_records` (
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
	`record_status` text DEFAULT 'PROG' NOT NULL,
	`managed_by` text NOT NULL,
	`observation` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_medical_records`("id", "reference", "record_type", "policy_id", "reporting_date", "reporter_first_name", "reporter_last_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "accident_evolution", "delegation_date", "coverage_issued", "coverage_date", "record_status", "managed_by", "observation", "created_at", "updated_at") SELECT "id", "reference", "record_type", "policy_id", "reporting_date", "reporter_first_name", "reporter_last_name", "reporter_phone", "accident_place", "accident_date", "accident_cause", "victim_first_name", "victim_last_name", "victim_phone", "victim_national_id", "victim_job", "accident_evolution", "delegation_date", "coverage_issued", "coverage_date", "record_status", "managed_by", "observation", CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM `medical_records`;--> statement-breakpoint
DROP TABLE `medical_records`;--> statement-breakpoint
ALTER TABLE `__new_medical_records` RENAME TO `medical_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_reference_unique` ON `medical_records` (`reference`);--> statement-breakpoint
CREATE TABLE `__new_medical_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medical_record_id` integer NOT NULL,
	`type` text NOT NULL,
	`service_provider_id` integer,
	`observation` text,
	`signed` integer,
	FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_provider_id`) REFERENCES `service_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_medical_documents`("id", "medical_record_id", "type", "service_provider_id", "observation", "signed") SELECT "id", "medical_record_id", "type", "service_provider_id", "observation", "signed" FROM `medical_documents`;--> statement-breakpoint
DROP TABLE `medical_documents`;--> statement-breakpoint
ALTER TABLE `__new_medical_documents` RENAME TO `medical_documents`;