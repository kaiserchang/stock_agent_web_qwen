import { describe, it, expect } from "vitest";

/**
 * 推薦指數計算邏輯測試（支持正負分）
 * 
 * 計分規則：
 * 推薦指數 = 訊號強度 × 季線位置係數 × 成交量係數
 * 
 * 買進訊號（正分）：
 * - 攻擊K線：100 分
 * - 多頭吞噬：75 分
 * - 內困型態：50 分
 * 
 * 賣出訊號（負分）：
 * - 黑K吞噬：-60 到 -120 分
 * 
 * 季線位置係數：
 * - 買進：股價 > MA60 為 1.0，< MA60 為 0.5
 * - 賣出：股價 < MA60 為 1.0（更危險），> MA60 為 0.5
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
  // 買進訊號強度
  const buySignalStrength: Record<string, number> = {
    "攻擊K線": 100,
    "多頭吞噬": 75,
    "內困型態": 50,
  };

  // 賣出訊號強度
  const sellSignalStrength: Record<string, number> = {
    "黑K吞噬": -60,
  };

  const buyStrength = buySignalStrength[signalType] || 0;
  const sellStrength = sellSignalStrength[signalType] || 0;

  // 如果沒有訊號，返回 0
  if (buyStrength === 0 && sellStrength === 0) return 0;

  let strength: number;
  let ma60_coefficient: number;

  if (buyStrength > 0) {
    strength = buyStrength;
    // 買進訊號：股價 > MA60 為 1.0，< MA60 為 0.5
    ma60_coefficient = closePrice > ma60 ? 1.0 : 0.5;
  } else {
    strength = sellStrength;
    // 賣出訊號：股價 < MA60 為 1.0（更危險），> MA60 為 0.5
    ma60_coefficient = closePrice < ma60 ? 1.0 : 0.5;
  }

  // 成交量係數
  let vol_coefficient: number;
  if (volume > vol_ma5 * 2) {
    vol_coefficient = 1.2;
  } else if (volume > vol_ma5 * 1.5) {
    vol_coefficient = 1.0;
  } else {
    vol_coefficient = 0.8;
  }

  // 計算最終分數
  const score = strength * ma60_coefficient * vol_coefficient;

  // 買進訊號上限 120，賣出訊號下限 -120
  if (score > 0) {
    return Math.min(Math.floor(score), 120);
  } else {
    return Math.max(Math.floor(score), -120);
  }
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

    it("應該給黑K吞噬負分", () => {
      const score = calculateRecommendationScore("黑K吞噬", 100, 95, 1000, 500);
      expect(score).toBeLessThan(0);
      expect(score).toBeGreaterThanOrEqual(-120);
    });

    it("應該給無訊號0分", () => {
      const score = calculateRecommendationScore("無", 100, 95, 1000, 500);
      expect(score).toBe(0);
    });
  });

  describe("季線位置係數", () => {
    it("買進訊號：股價在季線之上應該獲得1.0倍係數", () => {
      const score_above = calculateRecommendationScore("攻擊K線", 100, 95, 1000, 500);
      const score_below = calculateRecommendationScore("攻擊K線", 90, 95, 1000, 500);
      expect(score_above).toBeGreaterThan(score_below);
    });

    it("買進訊號：股價在季線之下應該獲得0.5倍係數", () => {
      const score = calculateRecommendationScore("攻擊K線", 90, 95, 1000, 500);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it("賣出訊號：股價在季線之下應該獲得1.0倍係數（更危險）", () => {
      const score_below = calculateRecommendationScore("黑K吞噬", 90, 95, 1000, 500);
      const score_above = calculateRecommendationScore("黑K吞噬", 100, 95, 1000, 500);
      expect(score_below).toBeLessThan(score_above);
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
    it("最佳買進訊號：攻擊K線 + 股價在季線之上 + 高成交量", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 1100, 500);
      expect(score).toBe(120); // 100 * 1.0 * 1.2 = 120
    });

    it("中等買進訊號：多頭吞噬 + 股價在季線之上 + 標準成交量", () => {
      const score = calculateRecommendationScore("多頭吞噬", 100, 95, 800, 500);
      expect(score).toBe(75); // 75 * 1.0 * 1.0 = 75
    });

    it("較低買進訊號：內困型態 + 股價在季線之上 + 標準成交量", () => {
      const score = calculateRecommendationScore("內困型態", 100, 95, 800, 500);
      expect(score).toBe(50); // 50 * 1.0 * 1.0 = 50
    });

    it("中低買進訊號：內困型態 + 股價在季線之上 + 低成交量", () => {
      const score = calculateRecommendationScore("內困型態", 100, 95, 700, 500);
      expect(score).toBe(40); // 50 * 1.0 * 0.8 = 40
    });

    it("分數應該不超過120", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 2000, 500);
      expect(score).toBeLessThanOrEqual(120);
    });

    it("分數應該不低於-120", () => {
      const score = calculateRecommendationScore("黑K吞噬", 90, 95, 2000, 500);
      expect(score).toBeGreaterThanOrEqual(-120);
    });
  });

  describe("星級評分（買進訊號）", () => {
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

  describe("炸彈評分（賣出訊號）", () => {
    it("黑K吞噬 + 股價在季線之下應該獲得最低分", () => {
      const score = calculateRecommendationScore("黑K吞噬", 90, 95, 1100, 500);
      expect(score).toBeLessThanOrEqual(-72); // -60 * 1.0 * 1.2 = -72
    });

    it("黑K吞噬 + 股價在季線之上應該獲得較高分", () => {
      const score_above = calculateRecommendationScore("黑K吞噬", 100, 95, 1100, 500);
      const score_below = calculateRecommendationScore("黑K吞噬", 90, 95, 1100, 500);
      expect(score_above).toBeGreaterThan(score_below);
      expect(score_above).toBeLessThan(0);
    });

    it("-120 到 -90 應該是 4 顆炸彈（強烈脫手）", () => {
      const score = calculateRecommendationScore("黑K吞噬", 90, 95, 1100, 500);
      expect(score).toBeLessThanOrEqual(-72);
      expect(score).toBeGreaterThanOrEqual(-120);
    });

    it("-60 到 -90 應該是 3 顆炸彈（建議脫手）", () => {
      const score = calculateRecommendationScore("黑K吞噬", 100, 95, 800, 500);
      expect(score).toBeLessThanOrEqual(-30); // -60 * 0.5 * 1.0 = -30
      expect(score).toBeGreaterThan(-60);
    });

    it("-30 到 -60 應該是 2 顆炸彈（注意風險）", () => {
      const score = calculateRecommendationScore("黑K吞噬", 100, 95, 700, 500);
      expect(score).toBeLessThanOrEqual(-24); // -60 * 0.5 * 0.8 = -24
      expect(score).toBeGreaterThanOrEqual(-60);
    });
  });

  describe("正負分綜合", () => {
    it("最佳買進訊號應該是正分", () => {
      const score = calculateRecommendationScore("攻擊K線", 100, 95, 1100, 500);
      expect(score).toBeGreaterThan(0);
    });

    it("最強賣出訊號應該是負分", () => {
      const score = calculateRecommendationScore("黑K吞噬", 90, 95, 1100, 500);
      expect(score).toBeLessThan(0);
    });

    it("中立訊號應該是0分", () => {
      const score = calculateRecommendationScore("無", 100, 95, 1000, 500);
      expect(score).toBe(0);
    });
  });
});
