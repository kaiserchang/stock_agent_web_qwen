import os
import pandas as pd
from FinMind.data import DataLoader
from dotenv import load_dotenv
import logging

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 載入環境變數 (建議將 API Token 放在 .env 檔案中)
load_dotenv()
FINMIND_TOKEN = os.getenv("FINMIND_TOKEN", "") # 若無 Token 則使用免費版限制

class TaiwanStockDataFetcher:
    def __init__(self, token=FINMIND_TOKEN):
        self.loader = DataLoader()
        if token:
            self.loader.login_token(token)
            logger.info("FinMind API Token 已載入")
        else:
            logger.warning("未偵測到 FinMind Token，將以免費模式執行 (有限制)")

    def get_stock_list(self):
        """
        獲取台灣股市全市場清單 (包含上市與上櫃個股)
        """
        try:
            logger.info("正在獲取台灣股票清單...")
            # 獲取所有股票清單
            df = self.loader.taiwan_stock_info()
            # 篩選出普通股 (通常類別為 'stock')
            stock_list = df[df['type'] == 'stock'][['stock_id', 'stock_name', 'industry_category']]
            logger.info(f"成功獲取 {len(stock_list)} 檔股票資訊")
            return stock_list
        except Exception as e:
            logger.error(f"獲取股票清單失敗: {e}")
            return None

    def get_historical_data(self, stock_id, start_date, end_date):
        """
        獲取特定股票的歷史日線數據
        """
        try:
            logger.info(f"正在獲取股票 {stock_id} 從 {start_date} 到 {end_date} 的數據...")
            df = self.loader.taiwan_stock_daily(
                stock_id=stock_id,
                start_date=start_date,
                end_date=end_date
            )
            if df.empty:
                logger.warning(f"股票 {stock_id} 在此區間無數據")
                return None
            
            # 轉換欄位名稱以符合後續技術分析習慣
            df = df.rename(columns={
                'date': 'Date',
                'open': 'Open',
                'max': 'High',
                'min': 'Low',
                'close': 'Close',
                'trading_volume': 'Volume'
            })
            df['Date'] = pd.to_datetime(df['Date'])
            df = df.set_index('Date')
            return df
        except Exception as e:
            logger.error(f"獲取股票 {stock_id} 數據失敗: {e}")
            return None

if __name__ == "__main__":
    # 測試範例
    fetcher = TaiwanStockDataFetcher()
    
    # 1. 獲取清單測試
    stocks = fetcher.get_stock_list()
    if stocks is not None:
        print("\n--- 台灣股票清單前 5 筆 ---")
        print(stocks.head())
        # 儲存清單供後續使用
        stocks.to_csv("taiwan_stock_list.csv", index=False, encoding='utf-8-sig')
        print("股票清單已儲存至 taiwan_stock_list.csv")

    # 2. 獲取特定個股數據測試 (以台積電 2330 為例)
    df_2330 = fetcher.get_historical_data("2330", "2024-01-01", "2024-06-19")
    if df_2330 is not None:
        print("\n--- 台積電 (2330) 歷史數據前 5 筆 ---")
        print(df_2330.head())
        # 儲存數據
        df_2330.to_csv("2330_daily_data.csv")
        print("2330 數據已儲存至 2330_daily_data.csv")
