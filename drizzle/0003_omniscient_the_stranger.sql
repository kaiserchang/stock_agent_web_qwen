CREATE TABLE `scan_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`stock_id` varchar(10) NOT NULL,
	`stock_name` varchar(50) NOT NULL,
	`status` enum('pending','scanning','completed','failed') NOT NULL DEFAULT 'pending',
	`signal_type` varchar(50),
	`message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scan_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scan_logs` ADD CONSTRAINT `scan_logs_session_id_scan_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `scan_sessions`(`id`) ON DELETE no action ON UPDATE no action;