import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { executePythonScript } from "./_core/pythonExecutor";
import { insertScanResult, insertScanSession, getLatestScanSession, getScanResultsBySessionId, getScanSessions, updateScanSession } from "./db";
import { ScanSession } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

const PYTHON_SCRIPT_PATH = "/home/ubuntu/stock_agent_web/server/python_logic/scan_orchestrator.py";

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
    startScan: protectedProcedure
      .input(z.object({
        scanLimit: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        signalFilter: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
        }

        const scanParams: { [key: string]: any } = {
          scan_limit: input.scanLimit,
          start_date_str: input.startDate,
          end_date_str: input.endDate,
          signal_filter: input.signalFilter,
        };

        const newSessionId = await insertScanSession({
          scanStartTime: new Date(),
          totalScannedStocks: 0,
          recommendationCount: 0,
          scanParameters: JSON.stringify(scanParams),
          userId: ctx.user.id,
          progress: 0, // Initialize progress
        });

        if (!newSessionId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create scan session" });
        }

        // Update scanParams with the actual session_id
        scanParams.session_id = newSessionId;

        // Execute Python script asynchronously and handle its Promise
        // We don\'t await it here so the API call returns immediately, but we handle its completion/errors.
        executePythonScript(PYTHON_SCRIPT_PATH, [
          "run_market_scan",
          scanParams,
        ], async (progress: number) => {
          // Update progress in the database
          await updateScanSession(newSessionId, { progress });
        }).then(async (pythonResult) => {
          if (pythonResult.status === "success") {
            const recommendations = pythonResult.recommendations;
            for (const rec of recommendations) {
              await insertScanResult({
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
            await updateScanSession(newSessionId, {
              scanEndTime: new Date(),
              totalScannedStocks: pythonResult.totalScannedStocks,
              recommendationCount: pythonResult.recommendationCount,
              progress: 100, // Mark as 100% complete on success
            });
          } else {
            console.error("Python scan script failed:", pythonResult.message);
            await updateScanSession(newSessionId, {
              scanEndTime: new Date(),
              progress: -1, // Mark as failed
            });
          }
        }).catch(async (error) => {
          console.error("Error executing Python scan script:", error);
          await updateScanSession(newSessionId, {
            scanEndTime: new Date(),
            progress: -1, // Mark as failed
          });
        });

        return { sessionId: newSessionId, message: "Scan initiated successfully. Results will be available shortly." };
      }),
    getLatestScanResults: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
        }
        const latestSession = await getLatestScanSession(ctx.user.id);
        if (!latestSession) {
          return { session: null, results: [] };
        }
        const results = await getScanResultsBySessionId(latestSession.id);
        return { session: latestSession, results };
    }),
    getScanHistory: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
        }
        const sessions = await getScanSessions(ctx.user.id);
        return sessions;
    }),
    getScanSessionDetails: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
        }
        const sessionIdNum = parseInt(input.sessionId, 10);
        if (isNaN(sessionIdNum)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid sessionId" });
        }
        // Verify that the session belongs to the current user
        const sessions = await getScanSessions(ctx.user.id);
        const sessionExists = sessions.some((s: any) => s.id === sessionIdNum);
        if (!sessionExists) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this scan session" });
        }
        const results = await getScanResultsBySessionId(sessionIdNum);
        return results;
      }),
    getScanSessionDetailsBySessionId: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
        }
        // Verify that the session belongs to the current user
        const sessions = await getScanSessions(ctx.user.id);
        const sessionExists = sessions.some((s: any) => s.id === input.sessionId);
        if (!sessionExists) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this scan session" });
        }
        const results = await getScanResultsBySessionId(input.sessionId);
        return results;
      }),
    getScanProgress: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
        }
        const session = await getLatestScanSession(ctx.user.id);
        if (!session || session.id !== input.sessionId) {
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
    getScanSettings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
      }
      return {
        scanLimit: 50,
        startDate: "",
        endDate: "",
        signalFilter: ["攻擊K線", "多頭吞噬", "黑K吞噬", "內困型態"],
      };
    }),
    updateScanSettings: protectedProcedure
      .input(z.object({
        scanLimit: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        signalFilter: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
        }
        console.log("Updated scan settings:", input);
        return {
          success: true,
          message: "Scan settings updated successfully",
        };
      }),
    getKlineData: protectedProcedure
      .input(z.object({
        stockId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
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
      }),
  }),
});

export type AppRouter = typeof appRouter;
