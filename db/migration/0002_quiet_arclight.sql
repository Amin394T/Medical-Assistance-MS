PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TEMP TABLE `__insurance_policy_employees_backup` AS
SELECT `id`, `policy_id`, `employee` FROM `insurance_policy_employees`;--> statement-breakpoint
CREATE TABLE `__new_insurance_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_number` text NOT NULL,
	`client_company` text NOT NULL,
	`client_activity` text,
	`client_address` text,
	`client_city` text,
	`type` text NOT NULL,
	`effective_date` integer NOT NULL,
	`status` text NOT NULL,
	`insurance_company_id` integer NOT NULL,
	`creation_date` integer NOT NULL,
	`last_updated` integer NOT NULL,
	FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_insurance_policies`("id", "policy_number", "client_company", "client_activity", "client_address", "client_city", "type", "effective_date", "status", "insurance_company_id", "creation_date", "last_updated") SELECT "id", "policy_number", "client_company", "client_activity", "client_address", "client_city", "type", "effective_date", "status", "insurance_company_id", "creation_date", "last_updated" FROM `insurance_policies`;--> statement-breakpoint
DROP TABLE `insurance_policies`;--> statement-breakpoint
ALTER TABLE `__new_insurance_policies` RENAME TO `insurance_policies`;--> statement-breakpoint
INSERT INTO `insurance_policy_employees` (`id`, `policy_id`, `employee`)
SELECT `id`, `policy_id`, `employee` FROM `__insurance_policy_employees_backup`;--> statement-breakpoint
DROP TABLE `__insurance_policy_employees_backup`;--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_policies_policy_number_unique` ON `insurance_policies` (`policy_number`);--> statement-breakpoint
ALTER TABLE `insurance_providers` DROP COLUMN `type`;