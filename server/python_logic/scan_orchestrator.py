import pandas as pd
import numpy as np
import pandas_ta as ta
import logging
import sys
import json
import requests
from datetime import datetime, timedelta
import yfinance as yf

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
        """獲取股票日線數據，使用 yfinance（快速且穩定）"""
        try:
            logger.info(f"Fetching data for {stock_id} from {start_date} to {end_date} using yfinance")
            
            # 台股代碼需要加上 .TW 後綴
            ticker = f"{stock_id}.TW"
            
            # 使用 yfinance 獲取數據
            df = yf.download(ticker, start=start_date, end=end_date, progress=False)
            
            if df.empty or len(df) == 0:
                logger.warning(f"No data fetched for {stock_id}")
                return pd.DataFrame()
            
            # 標準化列名
            df.columns = ['Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume']
            df = df.drop('Adj Close', axis=1)
            
            # 移除 NaN 值
            df = df.dropna()
            
            if len(df) < 30:
                logger.warning(f"Insufficient data for {stock_id}: {len(df)} rows (need 30)")
                return pd.DataFrame()
            
            logger.info(f"Successfully fetched {len(df)} days of data for {stock_id} from yfinance")
            return df
        except Exception as e:
            logger.error(f"Failed to fetch data for {stock_id} from yfinance: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return pd.DataFrame()

class ScanLogWriter:
    """用於寫入掃描日誌的類別"""
    def __init__(self, session_id, api_url="http://localhost:3000/api/trpc"):
        self.session_id = session_id
        self.api_url = api_url
        self.logs = []
        self.log_file = "data/scan_logs.json"
    
    def write_log(self, stock_id, stock_name, status, signal_type=None, message=None):
        """寫入單筆日誌到文件"""
        try:
            # 構建日誌數據
            log_data = {
                "sessionId": self.session_id,
                "stockId": stock_id,
                "stockName": stock_name,
                "status": status,
                "signalType": signal_type,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            # 本地緩存日誌（避免頻繁的文件 I/O）
            self.logs.append(log_data)
            # 每 5 筆日誌或特定狀態時才寫入文件
            if len(self.logs) >= 5 or status in ["completed", "failed"]:
                self._flush_logs()
        except Exception as e:
            logger.error(f"Error writing log for {stock_id}: {e}")
    
    def _flush_logs(self):
        """批量寫入緩存的日誌到文件"""
        if not self.logs:
            return
        try:
            # 讀取現有日誌
            import os
            if os.path.exists(self.log_file):
                with open(self.log_file, 'r', encoding='utf-8') as f:
                    existing_logs = json.load(f)
            else:
                existing_logs = []
            
            # 合併新日誌
            existing_logs.extend(self.logs)
            
            # 寫入文件
            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(existing_logs, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Flushed {len(self.logs)} logs to {self.log_file}")
            self.logs = []
        except Exception as e:
            logger.error(f"Error flushing logs: {e}")
    
    def flush_all(self):
        """確保所有日誌都被寫入"""
        self._flush_logs()

def parse_csv_data(csv_file_path, stock_id=None):
    """從 CSV 文件解析股票數據"""
    try:
        logger.info(f"Parsing CSV data from {csv_file_path}")
        
        # 讀取 CSV 文件
        df = pd.read_csv(csv_file_path)
        
        # 標準化列名（支援多種格式）
        df.columns = df.columns.str.strip().str.lower()
        
        # 嘗試找到日期列
        date_col = None
        for col in ['date', 'time', '日期', '時間']:
            if col in df.columns:
                date_col = col
                break
        
        if date_col is None:
            logger.error("CSV file must contain a 'date' column")
            return pd.DataFrame()
        
        # 標準化 OHLCV 列
        required_cols = ['open', 'high', 'low', 'close', 'volume']
        for col in required_cols:
            if col not in df.columns:
                # 嘗試找到相似的列名
                for c in df.columns:
                    if col[0] in c.lower():
                        df[col] = df[c]
                        break
        
        # 檢查是否有所有必要的列
        if not all(col in df.columns for col in required_cols):
            logger.error(f"CSV file must contain columns: {', '.join(required_cols)}")
            return pd.DataFrame()
        
        # 選擇必要的列
        df = df[[date_col, 'open', 'high', 'low', 'close', 'volume']]
        df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        
        # 轉換日期和數值
        df['Date'] = pd.to_datetime(df['Date'])
        df['Open'] = pd.to_numeric(df['Open'], errors='coerce')
        df['High'] = pd.to_numeric(df['High'], errors='coerce')
        df['Low'] = pd.to_numeric(df['Low'], errors='coerce')
        df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
        df['Volume'] = pd.to_numeric(df['Volume'], errors='coerce')
        
        # 移除 NaN 值
        df = df.dropna()
        
        # 排序並設置日期為索引
        df = df.sort_values('Date').reset_index(drop=True)
        df = df.set_index('Date')
        
        if len(df) < 30:
            logger.warning(f"Insufficient data in CSV: {len(df)} rows (need 30)")
            return pd.DataFrame()
        
        logger.info(f"Successfully parsed {len(df)} days of data from CSV")
        return df
    except Exception as e:
        logger.error(f"Failed to parse CSV data: {e}")
        import traceback
        logger.error(traceback.format_exc())
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

def analyze_csv_data(csv_file_path, stock_id=None, signal_filter=None):
    """分析上傳的 CSV 數據"""
    df_daily = parse_csv_data(csv_file_path, stock_id)
    
    if df_daily.empty:
        return {"status": "error", "message": "Failed to parse CSV data."}
    
    engine = LinJiaYangEngine(df_daily)
    analysis_result = engine.run_analysis()
    
    # 提取最新訊號
    latest_signal = analysis_result.iloc[-1]
    signal_type = latest_signal["Signal"]
    above_ma60 = bool(latest_signal["Above_MA60"])
    
    # 生成 K 線數據
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
    
    return {
        "status": "success",
        "stockId": stock_id or "uploaded",
        "signalType": signal_type,
        "aboveMa60": above_ma60,
        "closePrice": float(latest_signal["Close"]),
        "klines": kline_data
    }

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
    elif command == "analyze_csv":
        csv_file_path = sys.argv[2]
        stock_id = sys.argv[3] if len(sys.argv) > 3 else None
        signal_filter = json.loads(sys.argv[4]) if len(sys.argv) > 4 else None
        result = analyze_csv_data(csv_file_path, stock_id, signal_filter)
        print(json.dumps(result, default=str))
    else:
        print(json.dumps({"status": "error", "message": f"Unknown command: {command}"}), file=sys.stderr)
        sys.exit(1)
