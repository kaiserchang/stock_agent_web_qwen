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

    it("should throw UNAUTHORIZED error for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.stock.getScanSettings();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
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

    it("should throw UNAUTHORIZED error for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.stock.updateScanSettings({ scanLimit: 100 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("getScanHistory", () => {
    it("should return empty array when no scan history exists", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getScanHistory();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw UNAUTHORIZED error for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.stock.getScanHistory();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
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

    it("should throw UNAUTHORIZED error for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.stock.getScanSessionDetails({ sessionId: "1" });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw FORBIDDEN error when accessing another user's session", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.stock.getScanSessionDetails({ sessionId: "999" });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("getLatestScanResults", () => {
    it("should return null session when no scan results exist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stock.getLatestScanResults();

      expect(result).toEqual({
        session: null,
        results: [],
      });
    });

    it("should throw UNAUTHORIZED error for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.stock.getLatestScanResults();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
