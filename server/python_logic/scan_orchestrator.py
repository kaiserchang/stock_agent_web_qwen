import pandas as pd
import numpy as np
import pandas_ta as ta
import logging
import sys
import json
from datetime import datetime, timedelta

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 假設 LinJiaYangEngine 已經在同一個目錄下
from analysis_engine import LinJiaYangEngine

class TaiwanStockDataFetcher:
    def __init__(self):
        # FinMind API 設置
        # self.fm = FinMindApi(token='YOUR_FINMIND_API_TOKEN') # 如果有付費帳號，可以在此設定
        pass

    def get_taiwan_stock_list(self):
        try:
            df = ta.get_stock_list()
            # 篩選上市上櫃的普通股
            df = df[df["type"] == "上市櫃股票"]
            return df
        except Exception as e:
            logger.error(f"Error fetching stock list from FinMind: {e}")
            return pd.DataFrame()

    def get_stock_daily_data(self, stock_id, start_date, end_date):
        try:
            df = ta.get_stock_price(stock_id=stock_id, start_date=start_date, end_date=end_date)
            if df.empty:
                return pd.DataFrame()
            df = df.rename(columns={
                "date": "Date",
                "open": "Open",
                "max": "High",
                "min": "Low",
                "close": "Close",
                "Trading_Volume": "Volume"
            })
            df["Date"] = pd.to_datetime(df["Date"])
            df = df.set_index("Date")
            df = df[["Open", "High", "Low", "Close", "Volume"]]
            return df
        except Exception as e:
            logger.error(f"Error fetching daily data for {stock_id}: {e}")
            return pd.DataFrame()

def run_market_scan(params):
    fetcher = TaiwanStockDataFetcher()
    stock_list_df = fetcher.get_taiwan_stock_list()

    if stock_list_df.empty:
        return {"status": "error", "message": "Failed to get stock list."}

    scan_limit = params.get("scan_limit")
    if scan_limit:
        stock_list_df = stock_list_df.head(scan_limit)

    today = datetime.now()
    start_date_str = params.get("start_date_str", (today - timedelta(days=120)).strftime('%Y-%m-%d'))
    end_date_str = params.get("end_date_str", today.strftime('%Y-%m-%d'))
    signal_filter = params.get("signal_filter", [])

    recommendations = []
    total_scanned = 0

    for i, row in stock_list_df.iterrows():
        stock_id = row["stock_id"]
        stock_name = row["stock_name"]
        industry = row["industry_category"]

        df_daily = fetcher.get_stock_daily_data(stock_id, start_date_str, end_date_str)
        if df_daily.empty or len(df_daily) < 60: # 至少需要60天數據計算季線
            logger.info(f"Skipping {stock_id} due to insufficient data.")
            continue

        engine = LinJiaYangEngine(df_daily)
        analysis_result = engine.run_analysis()

        latest_signal = analysis_result.iloc[-1]
        signal_type = latest_signal["Signal"]
        above_ma60 = bool(latest_signal["Above_MA60"])

        if signal_type != "無":
            if not signal_filter or signal_type in signal_filter:
                recommendations.append({
                    "stockId": stock_id,
                    "stockName": stock_name,
                    "industry": industry,
                    "closePrice": latest_signal["Close"],
                    "signalType": signal_type,
                    "aboveMa60": above_ma60,
                    "scanDate": latest_signal.name.strftime('%Y-%m-%d')
                })
        total_scanned += 1

        progress = int(((i + 1) / len(stock_list_df)) * 100)
        print(f"PROGRESS:{progress}") # 透過 stdout 回報進度
        sys.stdout.flush() # 確保立即輸出

    return {
        "status": "success",
        "totalScannedStocks": total_scanned,
        "recommendationCount": len(recommendations),
        "recommendations": recommendations
    }

def get_stock_kline_data(stock_id, start_date_str, end_date_str):
    fetcher = TaiwanStockDataFetcher()
    df_daily = fetcher.get_stock_daily_data(stock_id, start_date_str, end_date_str)

    if df_daily.empty:
        return {"status": "error", "message": f"Failed to get kline data for {stock_id}."}

    engine = LinJiaYangEngine(df_daily)
    analysis_result = engine.run_analysis()

    # 將 DataFrame 轉換為適合前端的 JSON 格式
    kline_data = []
    for index, row in analysis_result.iterrows():
        kline_data.append({
            "Date": index.strftime('%Y-%m-%d'),
            "Open": row["Open"],
            "High": row["High"],
            "Low": row["Low"],
            "Close": row["Close"],
            "Volume": row["Volume"],
            "Signal": row["Signal"],
            "Above_MA60": bool(row["Above_MA60"])
        })
    
    return {"status": "success", "data": kline_data}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No command provided."}), file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]
    if command == "run_market_scan":
        params_str = sys.argv[2]
        params = json.loads(params_str)
        result = run_market_scan(params)
        print(json.dumps(result))
    elif command == "get_stock_kline_data":
        stock_id = sys.argv[2]
        start_date_str = sys.argv[3]
        end_date_str = sys.argv[4]
        result = get_stock_kline_data(stock_id, start_date_str, end_date_str)
        print(json.dumps(result))
    else:
        print(json.dumps({"status": "error", "message": f"Unknown command: {command}"}), file=sys.stderr)
        sys.exit(1)
