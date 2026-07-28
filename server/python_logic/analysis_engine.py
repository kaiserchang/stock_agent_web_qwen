import pandas as pd
import numpy as np
import pandas_ta as ta
import logging

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LinJiaYangEngine:
    """
    林家洋技術分析引擎
    核心邏輯：力竭原理、K線組合、趨勢位置、攻擊K線
    """
    def __init__(self, df):
        """
        df 必須包含 Open, High, Low, Close, Volume 欄位，索引為日期
        """
        self.df = df.copy()
        self._prepare_indicators()

    def _prepare_indicators(self):
        """計算基礎技術指標"""
        # 計算季線 (60MA) 作程多空分界
        # 使用 min_periods=1 以便在數據不足 60 天時也能計算
        self.df['MA60'] = self.df['Close'].rolling(window=60, min_periods=1).mean()
        # 計算實體大小與漲跌幅
        self.df['Body'] = self.df['Close'] - self.df['Open']
        self.df['Body_Abs'] = self.df['Body'].abs()
        self.df['Range'] = self.df['High'] - self.df['Low']
        self.df['Pct_Change'] = self.df['Close'].pct_change() * 100

    def is_bullish_engulfing(self, idx):
        """
        判斷是否為多頭吞噬 (Bullish Engulfing)
        條件：前一根是黑K，當前是紅K，且紅K實體完全包覆黑K實體
        """
        if idx < 1: return False
        prev = self.df.iloc[idx-1]
        curr = self.df.iloc[idx]
        
        cond1 = prev['Body'] < 0  # 前一根黑K
        cond2 = curr['Body'] > 0  # 當前紅K
        cond3 = (curr['Open'] <= prev['Close']) and (curr['Close'] >= prev['Open']) # 包覆實體
        # 林家洋強調位置：若在低檔或回檔後出現更有意義
        return cond1 and cond2 and cond3

    def is_bearish_engulfing(self, idx):
        """
        判斷是否為黑K吞噬 (Bearish Engulfing) - 不能買的型態
        條件：前一根是紅K，當前是黑K，且黑K實體完全包覆紅K實體
        """
        if idx < 1: return False
        prev = self.df.iloc[idx-1]
        curr = self.df.iloc[idx]
        
        cond1 = prev['Body'] > 0  # 前一根紅K
        cond2 = curr['Body'] < 0  # 當前黑K
        cond3 = (curr['Open'] >= prev['Close']) and (curr['Close'] <= prev['Open']) # 包覆實體
        return cond1 and cond2 and cond3

    def is_harami(self, idx):
        """
        判斷是否為內困型態 (Harami)
        條件：前一根是大K，當前是小K且被包覆在前一根實體內
        """
        if idx < 1: return False
        prev = self.df.iloc[idx-1]
        curr = self.df.iloc[idx]
        
        cond1 = prev['Body_Abs'] > curr['Body_Abs'] * 2 # 前根實體顯著較大
        cond2 = (curr['High'] <= prev['High']) and (curr['Low'] >= prev['Low']) # 價格範圍在內
        return cond1 and cond2

    def is_attack_k(self, idx):
        """
        判斷是否為攻擊K線
        條件：長紅K (漲幅 > 3%) 且成交量顯著放大 (大於 5 日均量 1.5 倍)
        """
        if idx < 5: return False
        curr = self.df.iloc[idx]
        vol_ma5 = self.df['Volume'].iloc[idx-5:idx].mean()
        
        cond1 = curr['Pct_Change'] >= 3.0 # 漲幅夠大
        cond2 = curr['Body'] > 0          # 紅K
        cond3 = curr['Volume'] > vol_ma5 * 1.5 # 量增
        return cond1 and cond2 and cond3

    def calculate_recommendation_score(self, idx):
        """
        計算推薦指數 (0-120 分)
        
        計分邏輯：
        推薦指數 = 訊號強度 × 季線位置係數 × 成交量係數
        
        訊號強度：
        - 攻擊K線：100 分
        - 多頭吞噬：75 分
        - 內困型態：50 分
        - 黑K吞噬：0 分
        - 無訊號：0 分
        
        季線位置係數：
        - 股價 > MA60：1.0 倍
        - 股價 < MA60：0.5 倍
        
        成交量係數：
        - 成交量 > 5日均量 × 2 倍：1.2 倍
        - 成交量 > 5日均量 × 1.5 倍：1.0 倍
        - 成交量 < 5日均量 × 1.5 倍：0.8 倍
        """
        if idx < 5:
            return 0
        
        curr = self.df.iloc[idx]
        signal = curr.get('Signal', '無')
        
        # 訊號強度
        signal_strength = {
            '攻擊K線': 100,
            '多頭吞噬': 75,
            '內困型態': 50,
            '黑K吞噬': 0,
            '無': 0
        }.get(signal, 0)
        
        if signal_strength == 0:
            return 0
        
        # 季線位置係數
        ma60_coefficient = 1.0 if curr['Close'] > curr['MA60'] else 0.5
        
        # 成交量係數
        vol_ma5 = self.df['Volume'].iloc[idx-5:idx].mean()
        if curr['Volume'] > vol_ma5 * 2:
            vol_coefficient = 1.2
        elif curr['Volume'] > vol_ma5 * 1.5:
            vol_coefficient = 1.0
        else:
            vol_coefficient = 0.8
        
        # 計算最終分數，上限 120
        score = signal_strength * ma60_coefficient * vol_coefficient
        return min(int(score), 120)

    def run_analysis(self):
        """
        執行全量分析，回傳包含訊號的 DataFrame
        """
        signals = []
        scores = []
        
        for i in range(len(self.df)):
            sig = "無"
            # 優先判斷買入訊號
            if self.is_attack_k(i):
                sig = "攻擊K線"
            elif self.is_bullish_engulfing(i):
                sig = "多頭吞噬"
            elif self.is_harami(i):
                sig = "內困型態"
            
            # 判斷賣出/警示訊號
            if self.is_bearish_engulfing(i):
                sig = "黑K吞噬"
                
            signals.append(sig)
        
        self.df['Signal'] = signals
        
        # 計算推薦指數
        for i in range(len(self.df)):
            score = self.calculate_recommendation_score(i)
            scores.append(score)
        
        self.df['RecommendationScore'] = scores
        
        # 加入位置判斷：股價是否在季線之上
        # 處理 NaN 值，預設為 False
        self.df['Above_MA60'] = (self.df['Close'] > self.df['MA60']).fillna(False)
        return self.df

if __name__ == "__main__":
    # 測試範例：讀取第一階段抓取的 2330 數據
    try:
        data = pd.read_csv("2330_daily_data.csv", index_col='Date', parse_dates=True)
        engine = LinJiaYangEngine(data)
        result = engine.run_analysis()
        
        # 篩選出有訊號的日期
        active_signals = result[result['Signal'] != "無"][['Close', 'Signal', 'Above_MA60']]
        print("\n--- 林家洋理論分析結果 (近期訊號) ---")
        print(active_signals.tail(10))
        
        # 儲存結果
        result.to_csv("analysis_result_2330.csv")
        print("\n完整分析結果已儲存至 analysis_result_2330.csv")
    except FileNotFoundError:
        print("請先執行第一階段 data_integration.py 以產生測試數據。")
