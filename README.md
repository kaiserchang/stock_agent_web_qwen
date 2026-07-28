# 台股技術分析儀表板 (Stock Agent Web)

基於林家洋老師的技術分析理論，自動掃描台灣股市投資機會的智能分析平台。

## 📋 專案概述

**台股技術分析儀表板**是一個全棧 Web 應用，結合了實時股票數據獲取、自動技術分析和互動式視覺化展示。系統使用 yfinance（Yahoo Finance）進行數據獲取，支援多種技術訊號識別，幫助投資者快速發現潛在投資機會。

### 核心特性

- **自動市場掃描**：一鍵掃描台灣股市，識別符合技術條件的股票
- **多種技術訊號**：支援攻擊K線、多頭吞噬、黑K吞噬、內困型態等訊號識別
- **K線圖表展示**：互動式 K 線圖表，實時顯示股票價格走勢
- **CSV 數據分析**：支援上傳 CSV 文件進行自定義技術分析
- **歷史紀錄保存**：自動保存最近 120 次掃描結果，方便追蹤和對比
- **響應式設計**：完美適配桌面、平板和手機設備

## 🏗️ 技術架構

### 前端技術棧
- **React 19** - UI 框架
- **Tailwind CSS 4** - 樣式引擎
- **tRPC** - 類型安全的 RPC 通信
- **Wouter** - 輕量級路由庫
- **shadcn/ui** - 高質量 UI 組件庫

### 後端技術棧
- **Express 4** - Web 服務器框架
- **tRPC 11** - 類型安全的 API 層
- **Node.js** - 運行時環境
- **Python 3** - 數據分析和技術指標計算

### 數據源
- **yfinance** - Yahoo Finance 數據源（全球股票數據，包含台股）
- **本地文件存儲** - JSON 格式保存掃描結果和歷史記錄

### 部署環境
- **Manus WebDev** - 全棧 Web 應用託管平台
- **Cloud Run** - 無伺服器容器運行環境
- **自動擴展** - 按需自動調整資源

## 📁 項目結構

```
stock_agent_web/
├── client/                          # 前端應用
│   ├── src/
│   │   ├── pages/                  # 頁面組件
│   │   │   ├── Dashboard.tsx       # 主儀表板（掃描控制、結果展示）
│   │   │   ├── KlineChart.tsx      # K線圖表頁面
│   │   │   ├── ScanHistory.tsx     # 掃描歷史紀錄
│   │   │   └── Settings.tsx        # 掃描設定頁面
│   │   ├── components/             # 可重用組件
│   │   ├── lib/                    # 工具函數
│   │   ├── App.tsx                 # 路由和佈局
│   │   └── index.css               # 全局樣式
│   ├── public/                     # 靜態資源
│   └── index.html                  # HTML 入口
├── server/                          # 後端應用
│   ├── python_logic/               # Python 分析引擎
│   │   └── scan_orchestrator.py    # 掃描和分析邏輯
│   ├── _core/                      # 核心基礎設施
│   │   ├── pythonExecutor.ts       # Python 執行器
│   │   ├── context.ts              # tRPC 上下文
│   │   ├── trpc.ts                 # tRPC 配置
│   │   └── index.ts                # 服務器入口
│   ├── routers.ts                  # tRPC 路由定義
│   ├── fileStorage.ts              # 文件存儲層
│   └── db.ts                       # 數據庫連接
├── data/                           # 本地數據存儲
│   ├── scan_sessions.json          # 掃描會話記錄
│   ├── scan_results.json           # 掃描結果（最新 120 筆）
│   └── scan_logs.json              # 掃描日誌
├── drizzle/                        # 數據庫遷移（未使用）
├── package.json                    # 項目依賴
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 構建配置
└── README.md                       # 本文件
```

## 🚀 快速開始

### 前置需求

在開始之前，請確保你的系統已安裝以下軟件：

- **Node.js** >= 18.0.0（[下載](https://nodejs.org/)）
- **Python** >= 3.9（[下載](https://www.python.org/)）
- **pnpm** 包管理器（推薦，[安裝指南](https://pnpm.io/installation)）
  - 或使用 npm：`npm install -g pnpm`

### 安裝步驟

#### 1. 克隆倉庫

```bash
git clone https://github.com/kaiserchang/stock-agent-web.git
cd stock_agent_web
```

#### 2. 安裝依賴

**安裝 Node.js 依賴**：
```bash
pnpm install
```

或使用 npm：
```bash
npm install
```

**安裝 Python 依賴**：
```bash
pip install -r requirements.txt
```

或使用 pip3：
```bash
pip3 install -r requirements.txt
```

依賴清單包括：
- `yfinance==0.2.32` - Yahoo Finance 數據源
- `pandas==2.0.3` - 數據處理
- `pandas-ta==0.3.14b0` - 技術指標計算
- `numpy==1.24.3` - 數值計算

#### 3. 啟動開發伺服器

```bash
pnpm dev
```

或使用 npm：
```bash
npm run dev
```

**預期輸出**：
```
[OAuth] Initialized with baseURL: https://api.manus.im
Server running on http://localhost:3000/
```

在瀏覽器中打開 [http://localhost:3000](http://localhost:3000) 即可看到應用。

### 首次使用指南

#### 步驟 1：訪問儀表板

打開應用後，你會看到「台股技術分析儀表板」主頁。

#### 步驟 2：執行掃描

1. 點擊藍色的「**開始掃描**」按鈕
2. 系統會開始掃描台灣股市（預設掃描最近 1 個月的 20 支股票，需要至少 20 天的數據）
3. 掃描進度會實時顯示在「掃描進度日誌」區域，包括：
   - 待掃描、掃描中、已完成、失敗的股票數量統計
   - 每支股票的掃描狀態和訊號類型
   - 支援按股票代號、狀態和訊號類型進行篩選
4. 掃描通常需要 2-3 分鐘完成
5. 完成後，結果會自動顯示在「投資建議名單」表格中

#### 步驟 3：查看掃描結果

掃描完成後，你會看到：

- **訊號統計摘要**：四個卡片分別顯示不同技術訊號的數量
  - 攻擊K線 ⚡
  - 多頭吞噬 📈
  - 黑K吞噬 ⚠️
  - 內困型態 📦

- **掃描進度日誌**：實時顯示掃描進度
  - 股票掃描狀態統計（待掃描/掃描中/已完成/失敗）
  - 每支股票的詳細掃描日誌
  - 支援搜尋和多維度篩選
  - 自動刷新（掃描中時每秒更新）

- **投資建議名單**：詳細表格顯示每支推薦股票
  - 股票代號、名稱、產業
  - 收盤價、技術訊號類型
  - 是否在季線（60 日均線）之上
  - 「查看K線」按鈕進入圖表分析

#### 步驟 4：查看 K 線圖表

1. 在投資建議名單中，點擊任意股票的「**查看K線**」按鈕
2. 進入 K 線圖表頁面，查看該股票的價格走勢
3. 圖表顯示開盤價、最高價、最低價、收盤價和成交量

#### 步驟 5：上傳 CSV 進行自定義分析

1. 準備 CSV 文件，格式如下：
   ```
   Date,Open,High,Low,Close,Volume
   2026-06-01,100.5,102.3,99.8,101.2,1000000
   2026-06-02,101.2,103.1,100.5,102.8,1200000
   ```

2. 點擊「**上傳CSV**」按鈕
3. 選擇 CSV 文件並上傳
4. 系統會分析你的數據並顯示技術訊號結果

#### 步驟 6：查看掃描歷史

1. 點擊「**歷史紀錄**」按鈕
2. 查看過去的掃描結果（保留最近 120 次）
3. 點擊任意歷史記錄查看詳細結果

#### 步驟 7：調整掃描設定

1. 點擊「**掃描設定**」按鈕
2. 調整以下參數：
   - **掃描數量**：要掃描的股票數量（預設 20）
   - **開始日期**：掃描的開始日期
   - **結束日期**：掃描的結束日期
   - **訊號篩選**：選擇要識別的技術訊號類型

3. 點擊「**保存設定**」後，下次掃描會使用新的參數

## 🔧 開發指南

### 常用命令

```bash
# 啟動開發伺服器（熱重載）
pnpm dev

# 構建生產版本
pnpm build

# 運行單元測試
pnpm test

# 代碼格式化
pnpm format

# TypeScript 類型檢查
pnpm type-check
```

### 添加新功能

#### 添加新的技術訊號

1. **編輯 Python 分析引擎**：
   ```python
   # server/python_logic/scan_orchestrator.py
   def detect_new_signal(df):
       # 實現你的技術分析邏輯
       return signal_results
   ```

2. **更新後端路由**：
   ```typescript
   // server/routers.ts
   stock: router({
     startScan: publicProcedure
       .mutation(async ({ input }) => {
         // 調用新的訊號檢測函數
       }),
   })
   ```

3. **更新前端 UI**：
   ```tsx
   // client/src/pages/Dashboard.tsx
   const signalStats = {
     newSignal: scanResults.filter((r) => r.signalType === "新訊號").length,
   };
   ```

#### 添加新頁面

1. 在 `client/src/pages/` 創建新組件
2. 在 `client/src/App.tsx` 中添加路由
3. 使用 tRPC hooks 調用後端 API

### 代碼風格

- 使用 TypeScript 進行類型安全
- 遵循 ESLint 和 Prettier 配置
- 為新功能編寫單元測試（Vitest）
- 使用 shadcn/ui 組件保持 UI 一致性

## 📊 技術指標說明

### 支援的技術訊號

| 訊號名稱 | 說明 | 應用場景 |
|---------|------|--------|
| **攻擊K線** | 股價突破重要阻力位 | 看漲信號，適合進場 |
| **多頭吞噬** | 前一根陰線被完全吞噬 | 強勢上升信號 |
| **黑K吞噬** | 前一根陽線被完全吞噬 | 下跌信號，需謹慎 |
| **內困型態** | 價格在小區間內震盪 | 整理信號，等待突破 |

### 季線判斷

- **季線（60日均線）**：長期趨勢指標
- **季線之上**：股票處於上升趨勢，更適合買進
- **季線之下**：股票處於下跌趨勢，應避免買進

## 🐛 常見問題

### Q1: 掃描速度很慢，需要 2-3 分鐘？

**A**: 這是正常的。系統需要為每支股票下載 20 天以上的歷史數據並進行技術分析。如果想加速，可以：
- 減少掃描股票數量（在掃描設定中調整）
- 縮短掃描時間範圍

### Q2: 上傳 CSV 後沒有結果？

**A**: 請檢查 CSV 文件格式：
- 必須包含 `Date`, `Open`, `High`, `Low`, `Close`, `Volume` 列
- 日期格式必須是 `YYYY-MM-DD`
- 數值必須是有效的數字

### Q3: 發布後掃描功能無法使用？

**A**: 發布環境有網絡限制，無法訪問外部 API（yfinance、twstock 等）。解決方案：
- **使用 CSV 上傳功能**：在本機下載股票數據，然後上傳到發布的應用進行分析
- **在本機開發環境中執行掃描**：本機有完整的網絡訪問權限，可正常使用掃描功能

### Q4: 如何修改掃描的股票清單？

**A**: 編輯 `server/python_logic/scan_orchestrator.py`：
```python
# 修改 STOCK_LIST 變數
STOCK_LIST = ['2317', '1101', '1216', ...]  # 添加或移除股票代碼
```

### Q5: 歷史記錄如何清空？

**A**: 刪除 `data/` 目錄下的 JSON 文件：
```bash
rm data/scan_sessions.json
rm data/scan_results.json
rm data/scan_logs.json
```

然後重啟應用。

## 📝 數據存儲

系統使用本地 JSON 文件存儲數據，無需外部數據庫：

- **scan_sessions.json**：掃描會話元數據（時間、進度、參數）
- **scan_results.json**：掃描結果（最新 120 筆）
- **scan_logs.json**：掃描執行日誌

所有數據自動保存在 `data/` 目錄中。

## 🔐 隱私和安全

- 所有數據存儲在本地 JSON 文件，不上傳到任何遠程伺服器
- 支援 Manus OAuth 認證（可選）
- 代碼完全開源，可審計

## ⚠️ 發布環境限制

**Manus 發布環境特性**：
- 網絡限制：無法訪問外部 API（yfinance、twstock 等）
- 解決方案：使用 **CSV 上傳功能**進行技術分析
- 建議工作流程：
  1. 在本機開發環境中執行掃描（或從其他源下載數據）
  2. 將結果上傳到發布的應用（使用 CSV 上傳功能）
  3. 在發布環境中查看結果和分析

## 📄 許可證

本項目採用 MIT 許可證。詳見 [LICENSE](LICENSE) 文件。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📞 聯絡方式

- **GitHub Issues**：[提交 Issue](https://github.com/kaiserchang/stock-agent-web/issues)
- **Email**：kaiser.tienkang@gmail.com

## 🙏 致謝

感謝林家洋老師提供的技術分析理論基礎，以及 yfinance 社區提供的股票數據接口。

---

**最後更新**：2026 年 7 月 28 日  
**版本**：1.0.0
