PRAGMA defer_foreign_keys = ON;--> statement-breakpoint
CREATE TABLE `insurance_policies_new` (
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
	`intermediary_id` integer,
	`creation_date` integer NOT NULL,
	`last_updated` integer NOT NULL,
	FOREIGN KEY (`insurance_company_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`intermediary_id`) REFERENCES `insurance_providers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `insurance_policies_new` (
	`id`, `policy_number`, `client_company`, `client_activity`, `client_address`, `client_city`,
	`type`, `effective_date`, `status`, `insurance_company_id`, `intermediary_id`, `creation_date`, `last_updated`
)
SELECT `id`, `policy_number`, `client_company`, NULL, NULL, NULL, 'REV', `effective_date`,
	CASE `status` WHEN 'RESU' THEN 'VALI' ELSE `status` END,
	`insurance_company_id`, `intermediary_id`, `creation_date`, `last_updated`
FROM `insurance_policies`;--> statement-breakpoint
DROP TABLE `insurance_policies`;--> statement-breakpoint
ALTER TABLE `insurance_policies_new` RENAME TO `insurance_policies`;--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_policies_policy_number_unique` ON `insurance_policies` (`policy_number`);--> statement-breakpoint
ALTER TABLE `medical_records` ADD `status_reason` text;--> statement-breakpoint
CREATE TABLE `insurance_policy_employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` integer NOT NULL,
	`employee` text NOT NULL,
	FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `insurance_policy_employees_policy_employee_unique` ON `insurance_policy_employees` (`policy_id`,`employee`);--> statement-breakpoint
PRAGMA defer_foreign_keys = OFF;