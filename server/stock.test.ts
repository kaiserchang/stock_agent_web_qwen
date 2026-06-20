import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: any) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("stock router", () => {
  describe("getScanSettings", () => {
    it("should return default scan settings for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getScanSettings();

      expect(result).toEqual({
        scanLimit: 50,
        startDate: "",
        endDate: "",
        signalFilter: ["攻擊K線", "多頭吞噬", "黑K吞噬", "內困型態"],
      });
    });

    it("should return default scan settings for unauthenticated user (public mode)", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getScanSettings();
      expect(result).toEqual({
        scanLimit: 50,
        startDate: "",
        endDate: "",
        signalFilter: ["攻擊K線", "多頭吞噬", "黑K吞噬", "內困型態"],
      });
    });
  });

  describe("updateScanSettings", () => {
    it("should update scan settings successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.updateScanSettings({
        scanLimit: 100,
        signalFilter: ["攻擊K線", "多頭吞噬"],
      });

      expect(result).toEqual({
        success: true,
        message: "Scan settings updated successfully",
      });
    });

    it("should update scan settings for unauthenticated user (public mode)", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.updateScanSettings({ scanLimit: 100 });
      expect(result).toEqual({
        success: true,
        message: "Scan settings updated successfully",
      });
    });
  });

  describe("getScanHistory", () => {
    it("should return scan history for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getScanHistory();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return scan history for unauthenticated user (public mode)", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getScanHistory();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getScanSessionDetails", () => {
    it("should throw BAD_REQUEST error for invalid sessionId", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.stock.getScanSessionDetails({ sessionId: "invalid" });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should return scan session details for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getScanSessionDetails({ sessionId: "1" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return scan session details for unauthenticated user (public mode)", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getScanSessionDetails({ sessionId: "1" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getLatestScanResults", () => {
    it("should return latest scan results for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getLatestScanResults();

      expect(result).toHaveProperty("session");
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);
    });

    it("should return latest scan results for unauthenticated user (public mode)", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getLatestScanResults();
      expect(result).toHaveProperty("session");
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);
    });
  });
});
