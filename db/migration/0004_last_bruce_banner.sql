ALTER TABLE `medical_records` RENAME COLUMN "accident_evolution" TO "evolution";--> statement-breakpoint
ALTER TABLE `medical_records` RENAME COLUMN "coverage_issued" TO "coverage";--> statement-breakpoint
ALTER TABLE `medical_records` ADD `delegation` integer DEFAULT false;