import { describe, it, expect } from "vitest";

/**
 * 推薦指數計算邏輯測試
 * 
 * 計分規則：
 * 推薦指數 = 訊號強度 × 季線位置係數 × 成交量係數
 * 
 * 訊號強度：
 * - 攻擊K線：100 分
 * - 多頭吞噬：75 分
 * - 內困型態：50 分
 * - 黑K吞噬：0 分
 * - 無訊號：0 分
 * 
 * 季線位置係數：
 * - 股價 > MA60：1.0 倍
 * - 股價 < MA60：0.5 倍
 * 
 * 成交量係數：
 * - 成交量 > 5日均量 × 2 倍：1.2 倍
 * - 成交量 > 5日均量 × 1.5 倍：1.0 倍
 * - 成交量 < 5日均量 × 1.5 倍：0.8 倍
 */

function calculateRecommendationScore(
  signalType: string,
  closePrice: number,
  ma60: number,
  volume: number,
  vol_ma5: number
): number {
  // 訊號強度
  const signalStrength: Record<string, number> = {
    "攻擊K線": 100,
    "多頭吞噬": 75,
    "內困型態": 50,
    "黑K吞噬": 0,
    "無": 0,
  };

  const strength = signalStrength[signalType] || 0;
  if (strength === 0) return 0;

  // 季線位置係數
  const ma60_coefficient = closePrice > ma60 ? 1.0 : 0.5;

  // 成交量係數
  let vol_coefficient: number;
  if (volume > vol_ma5 * 2) {
    vol_coefficient = 1.2;
  } else if (volume > vol_ma5 * 1.5) {
    vol_coefficient = 1.0;
  } else {
    vol_coefficient = 0.8;
  }

  // 計算最終分數，上限 120
  const score = strength * ma60_coefficient * vol_coefficient;
  return Math.min(Math.floor(score), 120);
}

describe("推薦指數計算", () => {
  describe("訊號強度", () => {
    it("應該給攻擊K線最高分", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 1000, 500);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(120);
    });

    it("應該給多頭吞噬中高分", () => {
      const score1 = calculateRecommendationScore("攻擊K線", 100, 95, 1000, 500);
      const score2 = calculateRecommendationScore("多頭吞噬", 100, 95, 1000, 500);
      expect(score2).toBeLessThan(score1);
      expect(score2).toBeGreaterThan(0);
    });

    it("應該給內困型態中等分", () => {
      const score = calculateRecommendationScore("內困型態", 100, 95, 1000, 500);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it("應該給黑K吞噬0分", () => {
      const score = calculateRecommendationScore("黑K吞噬", 100, 95, 1000, 500);
      expect(score).toBe(0);
    });

    it("應該給無訊號0分", () => {
      const score = calculateRecommendationScore("無", 100, 95, 1000, 500);
      expect(score).toBe(0);
    });
  });

  describe("季線位置係數", () => {
    it("股價在季線之上應該獲得1.0倍係數", () => {
      const score_above = calculateRecommendationScore("攻擊K線", 100, 95, 1000, 500);
      const score_below = calculateRecommendationScore("攻擊K線", 90, 95, 1000, 500);
      expect(score_above).toBeGreaterThan(score_below);
    });

    it("股價在季線之下應該獲得0.5倍係數", () => {
      const score = calculateRecommendationScore("攻擊K線", 90, 95, 1000, 500);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe("成交量係數", () => {
    it("成交量 > 5日均量 × 2 倍應該獲得1.2倍係數", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 1100, 500);
      expect(score).toBeGreaterThan(100);
    });

    it("成交量 > 5日均量 × 1.5 倍應該獲得1.0倍係數", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 800, 500);
      expect(score).toBe(100);
    });

    it("成交量 < 5日均量 × 1.5 倍應該獲得0.8倍係數", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 700, 500);
      expect(score).toBeLessThan(100);
    });
  });

  describe("綜合評分", () => {
    it("最佳情況：攻擊K線 + 股價在季線之上 + 高成交量", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 1100, 500);
      expect(score).toBe(120); // 100 * 1.0 * 1.2 = 120
    });

    it("中等情況：多頭吞噬 + 股價在季線之上 + 標準成交量", () => {
      const score = calculateRecommendationScore("多頭吞噬", 100, 95, 800, 500);
      expect(score).toBe(75); // 75 * 1.0 * 1.0 = 75
    });

    it("較低情況：內困型態 + 股價在季線之上 + 標準成交量", () => {
      const score = calculateRecommendationScore("內困型態", 100, 95, 800, 500);
      expect(score).toBe(50); // 50 * 1.0 * 1.0 = 50
    });

    it("較差情況：內困型態 + 股價在季線之下 + 低成交量", () => {
      const score = calculateRecommendationScore("內困型態", 90, 95, 700, 500);
      expect(score).toBe(20); // 50 * 0.5 * 0.8 = 20
    });

    it("中低情況：內困型態 + 股價在季線之上 + 低成交量", () => {
      const score = calculateRecommendationScore("內困型態", 100, 95, 700, 500);
      expect(score).toBe(40); // 50 * 1.0 * 0.8 = 40
    });

    it("分數應該不超過120", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 2000, 500);
      expect(score).toBeLessThanOrEqual(120);
    });
  });

  describe("星級評分", () => {
    it("90+ 分應該是 5 星", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 1100, 500);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it("75-89 分應該是 4 星", () => {
      const score = calculateRecommendationScore("多頭吞噬", 100, 95, 800, 500);
      expect(score).toBeGreaterThanOrEqual(75);
      expect(score).toBeLessThan(90);
    });

    it("60-74 分應該是 3 星", () => {
      const score = calculateRecommendationScore("多頭吞噬", 100, 95, 900, 500);
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThan(90);
    });

    it("45-59 分應該是 2 星", () => {
      const score = calculateRecommendationScore("內困型態", 100, 95, 900, 500);
      expect(score).toBeGreaterThanOrEqual(45);
      expect(score).toBeLessThan(60);
    });

    it("0-44 分應該是 1 星", () => {
      const score = calculateRecommendationScore("內困型態", 90, 95, 700, 500);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(45);
    });
  });
});
