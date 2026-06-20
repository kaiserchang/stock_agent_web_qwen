import pandas as pd
import numpy as np
import pandas_ta as ta
import logging
import sys
import json
import requests
from datetime import datetime, timedelta
from twstock import Stock

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
# 假設 LinJiaYangEngine 已經在同一個目錄下
from analysis_engine import LinJiaYangEngine

class TaiwanStockDataFetcher:
    def __init__(self):
        pass
    
    def get_taiwan_stock_list(self):
        """獲取台股清單，使用備用清單"""
        return self._get_fallback_stock_list()
    
    def _get_fallback_stock_list(self):
        """返回常見台股清單"""
        fallback_stocks = [
            {'stock_id': '2330', 'stock_name': '台積電', 'industry_category': '半導體'},
            {'stock_id': '2454', 'stock_name': '聯發科', 'industry_category': '半導體'},
            {'stock_id': '3008', 'stock_name': '大立光', 'industry_category': '光學'},
            {'stock_id': '2317', 'stock_name': '鴻海', 'industry_category': '電子'},
            {'stock_id': '2412', 'stock_name': '中華電', 'industry_category': '電信'},
            {'stock_id': '1101', 'stock_name': '台泥', 'industry_category': '水泥'},
            {'stock_id': '1102', 'stock_name': '亞泥', 'industry_category': '水泥'},
            {'stock_id': '1216', 'stock_name': '統一', 'industry_category': '食品'},
            {'stock_id': '1301', 'stock_name': '台塑', 'industry_category': '化工'},
            {'stock_id': '1303', 'stock_name': '南亞', 'industry_category': '化工'},
            {'stock_id': '2882', 'stock_name': '國泰金', 'industry_category': '金融'},
            {'stock_id': '2891', 'stock_name': '中信金', 'industry_category': '金融'},
            {'stock_id': '2886', 'stock_name': '兆豐金', 'industry_category': '金融'},
            {'stock_id': '1590', 'stock_name': '亞德客', 'industry_category': '機械'},
            {'stock_id': '2308', 'stock_name': '台達電', 'industry_category': '電機'},
            {'stock_id': '3231', 'stock_name': '緯創', 'industry_category': '電子'},
            {'stock_id': '2357', 'stock_name': '華碩', 'industry_category': '電子'},
            {'stock_id': '2379', 'stock_name': '瑞昱', 'industry_category': '半導體'},
            {'stock_id': '2395', 'stock_name': '力成', 'industry_category': '半導體'},
            {'stock_id': '2408', 'stock_name': '南亞科', 'industry_category': '半導體'},
        ]
        logger.info(f"Using stock list with {len(fallback_stocks)} stocks")
        return pd.DataFrame(fallback_stocks)

    def get_stock_daily_data(self, stock_id, start_date, end_date):
        """獲取股票日線數據，使用 twstock（台灣證券交易所官方數據）"""
        try:
            logger.info(f"Fetching data for {stock_id} from {start_date} to {end_date} using twstock")
            
            # 使用 twstock Stock 類從證交所獲取台股數據
            stock = Stock(stock_id)
            
            # 獲取整個數據集
            if not stock.data or len(stock.data) == 0:
                logger.warning(f"No data fetched for {stock_id}")
                return pd.DataFrame()
            
            # 轉換 twstock 數據為 DataFrame
            # stock.data 是一個 list of Data namedtuple，每個 Data 例如：
            # Data(date=datetime, capacity=..., open=..., high=..., low=..., close=..., volume=...)
            records = []
            for item in stock.data:
                try:
                    records.append({
                        'Date': item.date,
                        'Open': float(item.open),
                        'High': float(item.high),
                        'Low': float(item.low),
                        'Close': float(item.close),
                        'Volume': float(item.capacity)  # twstock 使用 capacity 作為成交量
                    })
                except (ValueError, TypeError, AttributeError) as e:
                    logger.debug(f"Skipping invalid row for {stock_id}: {item}")
                    continue
            
            if not records:
                logger.warning(f"No valid records for {stock_id}")
                return pd.DataFrame()
            
            df = pd.DataFrame(records)
            df['Date'] = pd.to_datetime(df['Date'])
            df = df.sort_values('Date').reset_index(drop=True)
            df = df.set_index('Date')
            
            # 移除 NaN 值
            df = df.dropna()
            
            if len(df) < 30:
                logger.warning(f"Insufficient data for {stock_id}: {len(df)} rows (need 30)")
                return pd.DataFrame()
            
            logger.info(f"Successfully fetched {len(df)} days of data for {stock_id} from twstock (TWSE)")
            return df
        except Exception as e:
            logger.error(f"Failed to fetch data for {stock_id} from twstock (TWSE): {e}")
            import traceback
            logger.error(traceback.format_exc())
            return pd.DataFrame()

class ScanLogWriter:
    """用於寫入掃描日誌的類別"""
    def __init__(self, session_id, api_url="http://localhost:3000/api/trpc"):
        self.session_id = session_id
        self.api_url = api_url
        self.logs = []
    
    def write_log(self, stock_id, stock_name, status, signal_type=None, message=None):
        """寫入單筆日誌到資料庫"""
        try:
            # 構建日誌數據
            log_data = {
                "sessionId": self.session_id,
                "stockId": stock_id,
                "stockName": stock_name,
                "status": status,
                "signalType": signal_type,
                "message": message,
            }
            # 本地緩存日誌（避免頻繁的 API 調用）
            self.logs.append(log_data)
            # 每 10 筆日誌或特定狀態時才寫入 API
            if len(self.logs) >= 10 or status in ["completed", "failed"]:
                self._flush_logs()
        except Exception as e:
            logger.error(f"Error writing log for {stock_id}: {e}")
    
    def _flush_logs(self):
        """批量寫入緩存的日誌"""
        if not self.logs:
            return
        try:
            # 這裡可以實現批量寫入 API
            # 暫時只是打印到 stdout，讓前端通過進度查詢 API 獲取
            for log in self.logs:
                print(f"LOG:{json.dumps(log)}", file=sys.stderr)
                sys.stderr.flush()
            self.logs = []
        except Exception as e:
            logger.error(f"Error flushing logs: {e}")
    
    def flush_all(self):
        """確保所有日誌都被寫入"""
        self._flush_logs()

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
    session_id = params.get("session_id")

    # 初始化日誌寫入器
    log_writer = ScanLogWriter(session_id) if session_id else None

    recommendations = []
    total_scanned = 0
    failed_count = 0

    for i, row in stock_list_df.iterrows():
        stock_id = row.get("stock_id") or row.get("code")
        stock_name = row.get("stock_name") or row.get("name")
        industry = row.get("industry_category") or row.get("industry") or "未分類"

        try:
            # 記錄掃描開始
            if log_writer:
                log_writer.write_log(stock_id, stock_name, "scanning", message="正在獲取數據...")

            df_daily = fetcher.get_stock_daily_data(stock_id, start_date_str, end_date_str)
            if df_daily.empty or len(df_daily) < 30:  # 至少需要30天數據計算均線
                logger.info(f"Skipping {stock_id} due to insufficient data (need 30 days, got {len(df_daily)}).")
                if log_writer:
                    log_writer.write_log(stock_id, stock_name, "failed", message="數據不足（少於60天）")
                failed_count += 1
                continue

            # 記錄分析開始
            if log_writer:
                log_writer.write_log(stock_id, stock_name, "scanning", message="正在分析技術訊號...")

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
                        "closePrice": float(latest_signal["Close"]),
                        "signalType": signal_type,
                        "aboveMa60": above_ma60,
                        "scanDate": latest_signal.name.strftime('%Y-%m-%d')
                    })
                    
                    # 記錄發現訊號
                    if log_writer:
                        log_writer.write_log(stock_id, stock_name, "completed", signal_type=signal_type, message=f"發現訊號：{signal_type}")
                else:
                    # 記錄訊號被過濾
                    if log_writer:
                        log_writer.write_log(stock_id, stock_name, "completed", signal_type=signal_type, message="訊號被過濾")
            else:
                # 記錄無訊號
                if log_writer:
                    log_writer.write_log(stock_id, stock_name, "completed", message="無技術訊號")

            total_scanned += 1

        except Exception as e:
            logger.error(f"Error analyzing {stock_id}: {e}")
            if log_writer:
                log_writer.write_log(stock_id, stock_name, "failed", message=f"分析失敗：{str(e)}")
            failed_count += 1

        progress = int(((i + 1) / len(stock_list_df)) * 100)
        print(f"PROGRESS:{progress}")  # 透過 stdout 回報進度
        sys.stdout.flush()  # 確保立即輸出

    # 確保所有日誌都被寫入
    if log_writer:
        log_writer.flush_all()

    return {
        "status": "success",
        "totalScannedStocks": total_scanned,
        "recommendationCount": len(recommendations),
        "failedCount": failed_count,
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
            "Open": float(row["Open"]),
            "High": float(row["High"]),
            "Low": float(row["Low"]),
            "Close": float(row["Close"]),
            "Volume": float(row["Volume"]),
            "Signal": row["Signal"],
            "Above_MA60": bool(row["Above_MA60"])
        })
    
    return {"status": "success", "klines": kline_data}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No command provided."}), file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]
    if command == "run_market_scan":
        params_str = sys.argv[2]
        params = json.loads(params_str)
        result = run_market_scan(params)
        print(json.dumps(result, default=str))
    elif command == "get_stock_kline_data":
        stock_id = sys.argv[2]
        start_date_str = sys.argv[3]
        end_date_str = sys.argv[4]
        result = get_stock_kline_data(stock_id, start_date_str, end_date_str)
        print(json.dumps(result, default=str))
    else:
        print(json.dumps({"status": "error", "message": f"Unknown command: {command}"}), file=sys.stderr)
        sys.exit(1)
