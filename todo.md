# Project TODO

## 後端功能 (Backend Features)
- [x] 整合 FinMind API 數據獲取功能
- [x] 整合林家洋技術分析引擎
- [x] 實作全市場掃描 API (包含進度回饋)
- [x] 實作掃描參數儲存與讀取 API
- [x] 實作 K 線圖數據獲取 API (包含技術訊號標註)
- [x] 設計與實作掃描結果資料庫儲存模型
- [x] 實作歷史掃描結果查詢 API
- [x] 實作可運作的 Python CLI 入口轉換為 Node 直接呼叫分析引擎，讓 `startScan` / `getKlineData` 流暢運作
- [x] 修正 `server/routers.ts` 中的語法錯誤，消除 `ERROR: Expected "}" but found ";"`
- [x] **新增**：新增掃描進度實時狀態與查詢 API（百分比更新與即時日誌），供前端查詢/展示
- [x] **新增**：新增掃描參數讀取與更新 API，確保設定與掃描邏輯串接一致
- [x] **新增**：新增依據 sessionId 查詢歷史掃描結果詳細的 API，完整議建議名單

## 前端功能 (Frontend Features)
- [x] 儀表板頁面基礎佈局
- [x] 顯示今日掃描投資建議名單表格 (股票代號、名稱、產業、收盤價、技術訊號類型、是否位於季線之上)
- [x] 訊號統計摘要卡片顯示 (攻擊K線、多頭吞噬等數量)
- [x] 一鍵觸發掃描按鈕與掃描進度顯示 (進度條)
- [x] 掃描參數設定頁面 (掃描數量上限、歷史數據天數、訊號過濾)
- [x] 點擊建議名單中的股票後，以互動式蠟燭圖顯示該股票的歷史K線，並在圖上標註技術訊號位置（如吞噬點、攻擊K線）- **已打算位置標註實作完成**
- [x] 掃描結果歷史紀錄查詢介面

## 設計與優化 (Design & Optimization)
- [x] 整體介面風格設計 (Elegant and Perfect) - **已實作漸層次的優雅設計**
- [x] 響應式設計 (Responsive Design) - **全頁面已優化，支援手機、平板、桌面訪問**
- [x] 單元測試編寫與使用者案例展示
- [x] 性能優化 - **已編寫 11 項單元測試，全部通過**


## 當前修改 (Current Changes)
- [x] 修改數據需求從 60 天改為 20 天以下
  - [x] 更新 scan_orchestrator.py 中的數據需求（30 天 → 20 天）
  - [x] 更新 Dashboard.tsx 中的日期預設範團（2 個月 → 1 個月）
  - [x] 更新 README.md 中的文檔說明
  - [x] 測試掃描功能確保 20 天數據足以進行技術分析

## 技術訊號說明文檔 (Signal Explanation Feature)
- [x] 創建 SIGNAL_EXPLANATION.md 文檔（包含完整的訊號講解）
- [x] 在 README.md 中添加詳細訊號講解部分
- [x] 創建 SignalExplanation.tsx 組件（交互式對話框）
- [x] 在 Dashboard.tsx 中添加訊號說明按鈕和組件整合


## 推薦指數功能 (Recommendation Score Feature)
- [x] 在數據庫 schema 中添加 recommendation_score 欄位
- [x] 在 analysis_engine.py 中實現推薦指數計算邏輯
- [x] 在 scan_orchestrator.py 中整合推薦指數計算
- [x] 在前端表格中添加推薦指數列和星級計算
- [x] 編寫 21 項單元測試，全部通過


## 買賣訊號視覺化 (Buy/Sell Signal Visualization)
- [x] 修改 analysis_engine.py 中的計分規則以支持負分（賣出訊號）
- [x] 修改 routers.ts 以保存負分訊號（score !== 0）
- [x] 創建 RecommendationBadge.tsx 組件（綠色上標 + 星級 / 紅色上標 + 炸彈 / 灰色上標 + 觀望）
- [x] 在 Dashboard.tsx 中整合 RecommendationBadge 組件
- [x] 編寫 42 項單元測試，全部通過
- [x] 視覺化設計完成：買進（綠色 + 星級）、賣出（紅色 + 炸彈）、中立（灰色 + 觀望）


## 設定頁面 (Settings Page)
- [x] 創建 Settings.tsx 頁面組件
- [x] 實現股票清單管理（添加/刪除）
- [x] 實現日期範圍選擇器（可選）
- [x] 實現訊號篩選選項
- [x] 路由已配置（/settings）
- [x] 與後端 API 整合（getScanSettings / updateScanSettings）
- [x] 後端持久化存儲实現（fileStorage.ts）
- [x] 設定自動保存功能完成


## UI/UX 改進 (UI/UX Improvements)
- [x] 實施高雅配色設計（金、銀、青、灰、白）
  - [x] 更新 index.css 中的顏色變量
  - [x] Dashboard 表格顏色方案已更新 表格顏色方案
  - [x] Settings 頁面顏色方案已更新 頁面顏色方案
  - [x] 確保警示和訊息文字有足夠對比度
- [x] 添加 Tooltip 提示功能
  - [x] 在推薦指數列添加 Tooltip
  - [x] 在訊號類型列添加 Tooltip
  - [x] 顯示買進/賣出/觀望的詳細說明
- [x] 驗證華碩數據變化（0 → -24）
- [x] 更新 README 文檔
- [x] 推送到 GitHub


## 新增任務 (2026-07-30)

### Bug 修復
- [x] 修複描描設定 Bug - 設定 500 但只描描 50 的問題
- [x] 修複描描歷史紀錄同步問題 - 描描結果沒有對應的歷史紀錄

### UI 改進
- [x] 改進描描中畫面 - 移除白色色塊改為深色
- [x] 改進描描中畫面 - 暗藍色文字改為亮色

### K線圖增強
- [x] 實現真正的 K線蠟燭圖（開盤、最高、最低、收盤）
- [x] 添加技術指標 - RSI（相對強度指數）
- [x] 添加技術指標 - MACD（指數平滑異同移動平均線）
- [x] 添加技術指標 - 布林带（Bollinger Bands）
- [x] 添加週期切換功能（日線、週線、月線）


## 新增任務 (2026-07-31 修復)

### 掃描設定 Bug
- [ ] 修正掃描設定只掃 20 檔的問題
- [ ] 確保掃描參數正確傳遞到後端

### K線圖顯示改進
- [ ] 實現真正的 OHLC 蠟燭圖（開盤、最高、最低、收盤）
- [ ] 添加獨立技術指標面板（RSI、MACD）
- [ ] 確保技術指標正確計算和顯示
