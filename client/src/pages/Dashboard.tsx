import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Zap, TrendingUp, AlertTriangle, Layers, Upload, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import ScanProgressLogs from "@/components/ScanProgressLogs";
import SignalExplanation from "@/components/SignalExplanation";
import { RecommendationBadge } from "@/components/RecommendationBadge";

interface ScanResult {
  id: number;
  sessionId: number;
  stockId: string;
  stockName: string;
  industry: string | null;
  closePrice: number;
  signalType: string;
  aboveMa60: number;
  recommendationScore: number;
  scanDate: Date;
}

interface ScanSession {
  id: number;
  scanStartTime: Date;
  scanEndTime: Date | null;
  totalScannedStocks: number | null;
  recommendationCount: number | null;
  progress: number;
  scanParameters: string | null;
  userId: number | null;
}

export default function Dashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [csvAnalysisResult, setCsvAnalysisResult] = useState<any>(null);
  const [isAnalyzingCsv, setIsAnalyzingCsv] = useState(false);
  const [showSignalExplanation, setShowSignalExplanation] = useState(false);

  // 查詢最新掃描結果
  const latestResultsQuery = trpc.stock.getLatestScanResults.useQuery(undefined, {
    enabled: true,
  });

  // 查詢掃描進度
  const getScanProgressQuery = trpc.stock.getScanProgress.useQuery(
    { sessionId: currentSessionId || 0 },
    {
      enabled: isScanning && currentSessionId !== null,
      refetchInterval: 1000, // 每秒輪詢一次
    }
  );

  // 監聽掃描進度
  useEffect(() => {
    if (getScanProgressQuery.data) {
      const progress = getScanProgressQuery.data.progress;
      setScanProgress(progress);
      
      if (getScanProgressQuery.data.status === "completed" || getScanProgressQuery.data.status === "failed") {
        setIsScanning(false);
        // 掃描完成，重新查詢最新結果
        latestResultsQuery.refetch();
      }
    }
  }, [getScanProgressQuery.data]);

  // 啟動掃描
  const startScanMutation = trpc.stock.startScan.useMutation({
    onSuccess: (data) => {
      console.log("掃描已啟動:", data);
      setIsScanning(true);
      setScanProgress(0);
      setCurrentSessionId(data.sessionId);
    },
    onError: (error) => {
      console.error("掃描失敗:", error);
      setIsScanning(false);
    },
  });

  const analyzeCsvMutation = trpc.stock.analyzeCsvData.useMutation({
    onSuccess: (data) => {
      console.log("CSV 分析完成:", data);
      setCsvAnalysisResult(data);
      setIsAnalyzingCsv(false);
    },
    onError: (error) => {
      console.error("CSV 分析失敗:", error);
      setIsAnalyzingCsv(false);
    },
  });

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      setIsAnalyzingCsv(true);
      analyzeCsvMutation.mutate({
        csvContent,
        stockId: "uploaded",
      });
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (latestResultsQuery.data?.results) {
      setScanResults(latestResultsQuery.data.results);
    }
  }, [latestResultsQuery.data]);

  // 清理函式：當 isScanning 變為 false 時停止輪詢
  useEffect(() => {
    if (!isScanning) {
      // 停止輪詢（通過 enabled: false）
    }
  }, [isScanning]);

  // 統計訊號數量
  const signalStats = {
    attackK: scanResults.filter((r) => r.signalType === "攻擊K線").length,
    bullishEngulfing: scanResults.filter((r) => r.signalType === "多頭吞噬").length,
    bearishEngulfing: scanResults.filter((r) => r.signalType === "黑K吞噬").length,
    harami: scanResults.filter((r) => r.signalType === "內困型態").length,
  };

  // 讀取掃描參數
  const getScanParams = () => {
    const stored = localStorage.getItem("scanParams");
    if (stored) {
      const params = JSON.parse(stored);
      return {
        scanLimit: params.scanLimit || 100,
        startDate: params.startDate || getDefaultStartDate(),
        endDate: params.endDate || new Date().toISOString().split('T')[0],
        signalFilter: params.signalFilter || [],
      };
    }
    return {
      scanLimit: 100,
      startDate: getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0],
      signalFilter: [],
    };
  };

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  const handleStartScan = () => {
    const params = getScanParams();
    startScanMutation.mutate({
      scanLimit: params.scanLimit,
      startDate: params.startDate,
      endDate: params.endDate,
      signalFilter: params.signalFilter,
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: "hsl(250, 20%, 15%)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 標題區 */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "hsl(45, 100%, 70%)" }}>台股技術分析儀表板</h1>
          <p className="text-sm md:text-base" style={{ color: "hsl(0, 0%, 80%)" }}>
            基於林家洋老師的技術分析理論，自動掃描台灣股市投資機會
          </p>
        </div>

        {/* 掃描控制區 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">掃描控制</CardTitle>
            <CardDescription>開始全市場技術訊號掃描或上傳 CSV 進行分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <Button
                onClick={handleStartScan}
                disabled={isScanning || startScanMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex-1 sm:flex-none"
              >
                {isScanning ? `掃描中... ${Math.round(scanProgress)}%` : "開始掃描"}
              </Button>
              <label className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={isAnalyzingCsv}
                  asChild
                >
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    {isAnalyzingCsv ? "分析中..." : "上傳CSV"}
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  disabled={isAnalyzingCsv}
                />
              </label>
              <Link href="/settings" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">
                  掃描設定
                </Button>
              </Link>
              <Link href="/history" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">
                  歷史紀錄
                </Button>
              </Link>
              <button
                onClick={() => setShowSignalExplanation(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-slate-700"
                title="查看技術訊號說明"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">訊號說明</span>
              </button>
            </div>

            {/* 進度條 */}
            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>掃描進度</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 掃描進度日誌 */}
        {isScanning && currentSessionId && (
          <ScanProgressLogs sessionId={currentSessionId} isScanning={isScanning} />
        )}

        {/* 訊號統計摘要卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">攻擊K線</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900">{signalStats.attackK}</p>
                </div>
                <Zap className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">多頭吞噬</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900">{signalStats.bullishEngulfing}</p>
                </div>
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">黑K吞噬</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900">{signalStats.bearishEngulfing}</p>
                </div>
                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">內困型態</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900">{signalStats.harami}</p>
                </div>
                <Layers className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 掃描進度日誌 */}
        {isScanning && currentSessionId && (
          <ScanProgressLogs sessionId={currentSessionId} isScanning={isScanning} />
        )}

        {/* CSV 分析結果 */}
        {csvAnalysisResult && (
          <Card className="border-0 shadow-lg bg-white border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-lg">CSV 分析結果</CardTitle>
              <CardDescription>
                股票代碼: {csvAnalysisResult.stockId} | 訊號: {csvAnalysisResult.signalType} | 收盤價: ${csvAnalysisResult.closePrice.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">訊號類型</p>
                    <p className="text-lg font-bold text-slate-900">{csvAnalysisResult.signalType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">季線之上</p>
                    <p className="text-lg font-bold text-slate-900">{csvAnalysisResult.aboveMa60 ? "是" : "否"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">收盤價</p>
                    <p className="text-lg font-bold text-slate-900">${typeof csvAnalysisResult.closePrice === 'number' && !isNaN(csvAnalysisResult.closePrice) ? csvAnalysisResult.closePrice.toFixed(2) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">K 線數據</p>
                    <p className="text-lg font-bold text-slate-900">{csvAnalysisResult.klines?.length || 0} 筆</p>
                  </div>
                </div>
                <Button
                  onClick={() => setCsvAnalysisResult(null)}
                  variant="outline"
                  className="w-full"
                >
                  清除結果
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 投資建議名單 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">投資建議名單</CardTitle>
            <CardDescription>
              {scanResults.length > 0
                ? `今日掃描出 ${scanResults.length} 檔股票`
                : "暫無掃描結果，請點擊「開始掃描」按鈕執行掃描"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanResults.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="text-slate-700 font-semibold">股票代號</TableHead>
                      <TableHead className="text-slate-700 font-semibold">名稱</TableHead>
                      <TableHead className="text-slate-700 font-semibold hidden md:table-cell">產業</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">收盤價</TableHead>
                      <TableHead className="text-slate-700 font-semibold">訊號類型</TableHead>
                      <TableHead className="text-slate-700 font-semibold">推薦指數</TableHead>
                      <TableHead className="text-slate-700 font-semibold hidden sm:table-cell">季線之上</TableHead>
                      <TableHead className="text-slate-700 font-semibold">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanResults.map((result) => (
                      <TableRow key={result.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <TableCell className="font-semibold text-slate-900">{result.stockId}</TableCell>
                        <TableCell className="text-slate-700">{result.stockName}</TableCell>
                        <TableCell className="text-slate-600 hidden md:table-cell">{result.industry}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          ${typeof result.closePrice === 'number' && !isNaN(result.closePrice) ? result.closePrice.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              result.signalType === "攻擊K線"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : result.signalType === "多頭吞噬"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : result.signalType === "黑K吞噬"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                : "bg-blue-100 text-blue-700 border-blue-300"
                            }`}
                          >
                            {result.signalType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <RecommendationBadge 
                            score={result.recommendationScore || 0} 
                            signalType={result.signalType}
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {result.aboveMa60 ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300">是</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-300">否</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/kline/${result.stockId}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              查看K線
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  暫無掃描結果。請點擊「開始掃描」按鈕執行掃描，或前往「掃描設定」調整掃描參數。
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 訊號說明對話框 */}
      <SignalExplanation open={showSignalExplanation} onOpenChange={setShowSignalExplanation} />
    </div>
  );
}
