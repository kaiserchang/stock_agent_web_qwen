import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const scanSessions = mysqlTable("scan_sessions", {
  id: int("id").autoincrement().primaryKey(),
  scanStartTime: timestamp("scan_start_time").defaultNow().notNull(),
  scanEndTime: timestamp("scan_end_time"),
  totalScannedStocks: int("total_scanned_stocks"),
  recommendationCount: int("recommendation_count"),
  progress: int("progress").default(0).notNull(), // 掃描進度 0-100
  scanParameters: text("scan_parameters"), // Store as JSON string
  userId: int("user_id").references(() => users.id),
});

export type ScanSession = typeof scanSessions.$inferSelect;
export type InsertScanSession = typeof scanSessions.$inferInsert;

export const scanResults = mysqlTable("scan_results", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").references(() => scanSessions.id).notNull(),
  stockId: varchar("stock_id", { length: 10 }).notNull(),
  stockName: varchar("stock_name", { length: 50 }).notNull(),
  industry: varchar("industry", { length: 50 }),
  closePrice: int("close_price").notNull(),
  signalType: varchar("signal_type", { length: 50 }).notNull(),
  aboveMa60: int("above_ma60").notNull(), // 0 for false, 1 for true
  recommendationScore: int("recommendation_score").default(0).notNull(), // 推薦指數 0-120
  scanDate: timestamp("scan_date").notNull(),
});

export type ScanResult = typeof scanResults.$inferSelect;
export type InsertScanResult = typeof scanResults.$inferInsert;

export const scanLogs = mysqlTable("scan_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").references(() => scanSessions.id).notNull(),
  stockId: varchar("stock_id", { length: 10 }).notNull(),
  stockName: varchar("stock_name", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "scanning", "completed", "failed"]).default("pending").notNull(),
  signalType: varchar("signal_type", { length: 50 }),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ScanLog = typeof scanLogs.$inferSelect;
export type InsertScanLog = typeof scanLogs.$inferInsert;
