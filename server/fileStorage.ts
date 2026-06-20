import * as fs from "fs";
import * as path from "path";

// 存儲目錄
const STORAGE_DIR = path.join(process.cwd(), "data");
const RESULTS_FILE = path.join(STORAGE_DIR, "scan_results.json");
const SESSIONS_FILE = path.join(STORAGE_DIR, "scan_sessions.json");
const LOGS_FILE = path.join(STORAGE_DIR, "scan_logs.json");

// 確保存儲目錄存在
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// 初始化文件
function initializeFiles() {
  ensureStorageDir();

  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
  }
}

// 讀取 JSON 文件
function readJSON(filePath: string): any[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) || [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// 寫入 JSON 文件
function writeJSON(filePath: string, data: any[]) {
  try {
    ensureStorageDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// 掃描會話類型
export interface ScanSession {
  id: number;
  scanStartTime: Date;
  scanEndTime: Date | null;
  totalScannedStocks: number | null;
  recommendationCount: number | null;
  progress: number;
  scanParameters: string | null;
  userId: number | null;
}

// 掃描結果類型
export interface ScanResult {
  id: number;
  sessionId: number;
  stockId: string;
  stockName: string;
  industry: string | null;
  closePrice: number;
  signalType: string;
  aboveMa60: number;
  scanDate: Date;
}

// 掃描日誌類型
export interface ScanLog {
  id: number;
  sessionId: number;
  stockId: string;
  stockName: string;
  status: "pending" | "scanning" | "completed" | "failed";
  signalType: string | null;
  details: string | null;
  timestamp: Date;
}

// ==================== 掃描會話操作 ====================

export function insertScanSession(session: Omit<ScanSession, "id">): number {
  initializeFiles();
  const sessions = readJSON(SESSIONS_FILE) as any[];
  const newId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
  const newSession = {
    ...session,
    id: newId,
    scanStartTime: new Date(session.scanStartTime),
    scanEndTime: session.scanEndTime ? new Date(session.scanEndTime) : null,
    scanDate: new Date(session.scanStartTime),
  };
  sessions.push(newSession);
  writeJSON(SESSIONS_FILE, sessions);
  return newId;
}

export function updateScanSession(sessionId: number, updates: Partial<ScanSession>): void {
  initializeFiles();
  const sessions = readJSON(SESSIONS_FILE) as any[];
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = {
      ...sessions[index],
      ...updates,
      scanEndTime: updates.scanEndTime ? new Date(updates.scanEndTime) : sessions[index].scanEndTime,
    };
    writeJSON(SESSIONS_FILE, sessions);
  }
}

export function getLatestScanSession(userId: number | null): ScanSession | null {
  initializeFiles();
  const sessions = readJSON(SESSIONS_FILE) as any[];
  // 公開模式：不過濾 userId
  const filtered = sessions.sort((a, b) => new Date(b.scanStartTime).getTime() - new Date(a.scanStartTime).getTime());
  return filtered.length > 0 ? filtered[0] : null;
}

export function getScanSessions(userId: number | null): ScanSession[] {
  initializeFiles();
  const sessions = readJSON(SESSIONS_FILE) as any[];
  return sessions.sort((a, b) => new Date(b.scanStartTime).getTime() - new Date(a.scanStartTime).getTime());
}

// ==================== 掃描結果操作 ====================

export function insertScanResult(result: Omit<ScanResult, "id">): number {
  initializeFiles();
  const results = readJSON(RESULTS_FILE) as any[];
  
  // 保留最新 120 筆
  if (results.length >= 120) {
    results.shift();
  }
  
  const newId = results.length > 0 ? Math.max(...results.map(r => r.id)) + 1 : 1;
  const newResult = {
    ...result,
    id: newId,
    scanDate: new Date(result.scanDate),
  };
  results.push(newResult);
  writeJSON(RESULTS_FILE, results);
  return newId;
}

export function getScanResultsBySessionId(sessionId: number): ScanResult[] {
  initializeFiles();
  const results = readJSON(RESULTS_FILE) as any[];
  return results
    .filter(r => r.sessionId === sessionId)
    .map(r => ({
      ...r,
      scanDate: new Date(r.scanDate),
    }));
}

// ==================== 掃描日誌操作 ====================

export function insertScanLog(log: Omit<ScanLog, "id">): number {
  initializeFiles();
  const logs = readJSON(LOGS_FILE) as any[];
  
  // 保留最新 1000 筆日誌
  if (logs.length >= 1000) {
    logs.shift();
  }
  
  const newId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
  const newLog = {
    ...log,
    id: newId,
    timestamp: new Date(log.timestamp),
  };
  logs.push(newLog);
  writeJSON(LOGS_FILE, logs);
  return newId;
}

export function updateScanLog(logId: number, updates: Partial<ScanLog>): void {
  initializeFiles();
  const logs = readJSON(LOGS_FILE) as any[];
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index] = {
      ...logs[index],
      ...updates,
      timestamp: updates.timestamp ? new Date(updates.timestamp) : logs[index].timestamp,
    };
    writeJSON(LOGS_FILE, logs);
  }
}

export function getScanLogsBySessionId(sessionId: number): ScanLog[] {
  initializeFiles();
  const logs = readJSON(LOGS_FILE) as any[];
  return logs
    .filter(l => l.sessionId === sessionId)
    .map(l => ({
      ...l,
      timestamp: new Date(l.timestamp),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
