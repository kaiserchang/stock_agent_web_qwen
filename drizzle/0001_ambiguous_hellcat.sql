CREATE TABLE `scan_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`stock_id` varchar(10) NOT NULL,
	`stock_name` varchar(50) NOT NULL,
	`industry` varchar(50),
	`close_price` int NOT NULL,
	`signal_type` varchar(50) NOT NULL,
	`above_ma60` int NOT NULL,
	`scan_date` timestamp NOT NULL,
	CONSTRAINT `scan_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scan_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scan_start_time` timestamp NOT NULL DEFAULT (now()),
	`scan_end_time` timestamp,
	`total_scanned_stocks` int,
	`recommendation_count` int,
	`scan_parameters` text,
	`user_id` int,
	CONSTRAINT `scan_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scan_results` ADD CONSTRAINT `scan_results_session_id_scan_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `scan_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scan_sessions` ADD CONSTRAINT `scan_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;