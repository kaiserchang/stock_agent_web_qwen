import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertScanResult, InsertScanSession, InsertUser, scanResults, scanSessions, users, scanLogs, InsertScanLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function insertScanSession(session: InsertScanSession): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert scan session: database not available");
    return null;
  }
  try {
    const result = await db.insert(scanSessions).values({
      ...session,
      progress: session.progress || 0, // Ensure progress is set, default to 0
    });
    return result[0].insertId;
  } catch (error) {
    console.error("[Database] Failed to insert scan session:", error);
    return null;
  }
}

export async function updateScanSession(sessionId: number, updates: Partial<InsertScanSession>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update scan session: database not available");
    return;
  }
  try {
    await db.update(scanSessions).set(updates).where(eq(scanSessions.id, sessionId));
  } catch (error) {
    console.error("[Database] Failed to update scan session:", error);
  }
}

export async function insertScanResult(result: InsertScanResult) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert scan result: database not available");
    return;
  }
  await db.insert(scanResults).values(result);
}

export async function getLatestScanSession(userId: number | null) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get latest scan session: database not available");
    return undefined;
  }
  const query = userId === null 
    ? db.select().from(scanSessions).orderBy(desc(scanSessions.scanStartTime)).limit(1)
    : db.select().from(scanSessions).where(eq(scanSessions.userId, userId)).orderBy(desc(scanSessions.scanStartTime)).limit(1);
  const result = await query;
  return result.length > 0 ? result[0] : undefined;
}

export async function getScanResultsBySessionId(sessionId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scan results: database not available");
    return [];
  }
  return await db.select().from(scanResults).where(eq(scanResults.sessionId, sessionId)).orderBy(scanResults.signalType, scanResults.stockId);
}

export async function getScanSessions(userId: number | null, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scan sessions: database not available");
    return [];
  }
  const query = userId === null
    ? db.select().from(scanSessions).orderBy(desc(scanSessions.scanStartTime)).limit(limit)
    : db.select().from(scanSessions).where(eq(scanSessions.userId, userId)).orderBy(desc(scanSessions.scanStartTime)).limit(limit);
  return await query;
}

export async function insertScanLog(log: InsertScanLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert scan log: database not available");
    return;
  }
  try {
    await db.insert(scanLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to insert scan log:", error);
  }
}

export async function updateScanLog(logId: number, updates: Partial<InsertScanLog>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update scan log: database not available");
    return;
  }
  try {
    await db.update(scanLogs).set(updates).where(eq(scanLogs.id, logId));
  } catch (error) {
    console.error("[Database] Failed to update scan log:", error);
  }
}

export async function getScanLogsBySessionId(sessionId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get scan logs: database not available");
    return [];
  }
  return await db.select().from(scanLogs).where(eq(scanLogs.sessionId, sessionId)).orderBy(scanLogs.createdAt);
}

// TODO: add feature queries here as your schema grows.
