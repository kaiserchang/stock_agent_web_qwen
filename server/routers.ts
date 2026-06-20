import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { executePythonScript } from "./_core/pythonExecutor";
import { insertScanResult, insertScanSession, getLatestScanSession, getScanResultsBySessionId, getScanSessions, updateScanSession, getScanLogsBySessionId, insertScanLog } from "./fileStorage";
import { TRPCError } from "@trpc/server";

const PYTHON_SCRIPT_PATH = "server/python_logic/scan_orchestrator.py"; // 使用相對路徑


export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  stock: router({
    startScan: publicProcedure
      .input(z.object({
        scanLimit: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        signalFilter: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const scanParams: { [key: string]: any } = {
          scan_limit: input.scanLimit,
          start_date_str: input.startDate,
          end_date_str: input.endDate,
          signal_filter: input.signalFilter,
        };

        const newSessionId = insertScanSession({
          scanStartTime: new Date(),
          scanEndTime: null,
          totalScannedStocks: 0,
          recommendationCount: 0,
          scanParameters: JSON.stringify(scanParams),
          userId: null, // 公開模式，不關聯用戶
          progress: 0,
        });

        if (!newSessionId || newSessionId <= 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create scan session" });
        }

        scanParams.session_id = newSessionId;

        // 異步執行掃描，不等待完成（避免 HTTP 超時）
        // 前端通過 getScanProgress 輪詢進度
        setImmediate(() => {
          executePythonScript(PYTHON_SCRIPT_PATH, [
            "run_market_scan",
            scanParams,
          ], async (progress: number) => {
            updateScanSession(newSessionId, { progress });
          }).then((pythonResult) => {
            if (pythonResult.status === "success") {
              const recommendations = pythonResult.recommendations;
              for (const rec of recommendations) {
                insertScanResult({
                  sessionId: newSessionId,
                  stockId: rec.stockId,
                  stockName: rec.stockName,
                  industry: rec.industry,
                  closePrice: rec.closePrice,
                  signalType: rec.signalType,
                  aboveMa60: rec.aboveMa60,
                  scanDate: new Date(rec.scanDate),
                });
              }
              updateScanSession(newSessionId, {
                scanEndTime: new Date(),
                totalScannedStocks: pythonResult.totalScannedStocks,
                recommendationCount: pythonResult.recommendationCount,
                progress: 100,
              });
            } else {
              console.error("Python scan script failed:", pythonResult.message);
              updateScanSession(newSessionId, {
                scanEndTime: new Date(),
                progress: -1,
              });
            }
          }).catch((error) => {
            console.error("Error executing Python scan script:", error);
            updateScanSession(newSessionId, {
              scanEndTime: new Date(),
              progress: -1,
            });
          });
        });

        return { sessionId: newSessionId, message: "Scan initiated successfully. Results will be available shortly." };
      }),
    getLatestScanResults: publicProcedure.query(() => {
        const latestSession = getLatestScanSession(null);
        if (!latestSession) {
          return { session: null, results: [] };
        }
        const results = getScanResultsBySessionId(latestSession.id);
        return { session: latestSession, results };
    }),
    getScanHistory: publicProcedure.query(() => {
        const sessions = getScanSessions(null);
        return sessions;
    }),
    getScanSessionDetails: publicProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(({ input }) => {
        const sessionIdNum = parseInt(input.sessionId, 10);
        if (isNaN(sessionIdNum)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid sessionId" });
        }
        const results = getScanResultsBySessionId(sessionIdNum);
        return results;
      }),
    getScanSessionDetailsBySessionId: publicProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(({ input }) => {
        const results = getScanResultsBySessionId(input.sessionId);
        return results;
      }),
    getScanProgress: publicProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(({ input }) => {
        // 根據 sessionId 查找對應的掃描會話
        const sessions = getScanSessions(null);
        const session = sessions.find(s => s.id === input.sessionId);
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Scan session not found" });
        }
        return {
          sessionId: session.id,
          progress: session.progress,
          status: session.progress === 100 ? "completed" : session.progress === -1 ? "failed" : "scanning",
          totalScannedStocks: session.totalScannedStocks,
          recommendationCount: session.recommendationCount,
        };
      }),
    getScanSettings: publicProcedure.query(() => {
      return {
        scanLimit: 50,
        startDate: "",
        endDate: "",
        signalFilter: ["攻擊K線", "多頭吞噬", "黑K吞噬", "內困型態"],
      };
    }),
    updateScanSettings: publicProcedure
      .input(z.object({
        scanLimit: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        signalFilter: z.array(z.string()).optional(),
      }))
      .mutation(({ input }) => {
        console.log("Updated scan settings:", input);
        return {
          success: true,
          message: "Scan settings updated successfully",
        };
      }),
    getScanLogs: publicProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(({ input }) => {
        const logs = getScanLogsBySessionId(input.sessionId);
        return logs;
      }),
    getKlineData: publicProcedure
      .input(z.object({
        stockId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const klineResult = await executePythonScript(PYTHON_SCRIPT_PATH, [
            "get_stock_kline_data",
            input.stockId,
            input.startDate,
            input.endDate,
          ]);

          if (klineResult.status === "success") {
            return klineResult;
          } else {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: klineResult.message });
          }
        } catch (error) {
          console.error(`[getKlineData] Failed to fetch kline data for ${input.stockId}:`, error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to fetch kline data: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
