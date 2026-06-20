
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Zap, TrendingUp, AlertTriangle, Layers } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import ScanProgressLogs from "@/components/ScanProgressLogs";

interface ScanResult {
  id: number;
  sessionId: number;
  stockId: string;
  stockName: string;
  industry: string | null;
  closePrice: number;
  signalType: string;
  aboveMa60: number;
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

  // 查詢最新掃描結果
  const latestResultsQuery = trpc.stock.getLatestScanResults.useQuery(undefined, {
    enabled: true,
  });

  // 啟動掃描
  const startScanMutation = trpc.stock.startScan.useMutation({
    onSuccess: (data) => {
      console.log("掃描已啟動:", data);
      setIsScanning(true);
      setScanProgress(0);
      setCurrentSessionId(data.sessionId);
      
      // 模擬進度更新（實際應該輪詢後端）
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // 5秒後完成掃描
      setTimeout(() => {
        clearInterval(progressInterval);
        setScanProgress(100);
        setIsScanning(false);
        latestResultsQuery.refetch();
      }, 5000);
    },
    onError: (error) => {
      console.error("掃描失敗:", error);
      setIsScanning(false);
    },
  });

  useEffect(() => {
    if (latestResultsQuery.data?.results) {
      setScanResults(latestResultsQuery.data.results);
    }
  }, [latestResultsQuery.data]);

  // 統計訊號數量
  const signalStats = {
    attackK: scanResults.filter((r) => r.signalType === "攻擊K線").length,
    bullishEngulfing: scanResults.filter((r) => r.signalType === "多頭吞噬").length,
    bearishEngulfing: scanResults.filter((r) => r.signalType === "黑K吞噬").length,
    harami: scanResults.filter((r) => r.signalType === "內困型態").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 標題區 */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">台股技術分析儀表板</h1>
          <p className="text-slate-600 text-sm md:text-base">
            基於林家洋老師的技術分析理論，自動掃描台灣股市投資機會
          </p>
        </div>

        {/* 掃描控制區 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">掃描控制</CardTitle>
            <CardDescription>開始全市場技術訊號掃描</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <Button
                onClick={() => startScanMutation.mutate({})}
                disabled={isScanning || startScanMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex-1 sm:flex-none"
              >
                {isScanning ? "掃描中..." : "開始掃描"}
              </Button>
              <Link href="/settings" className="flex-1 sm:flex-none">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-50 w-full">
                  掃描設定
                </Button>
              </Link>
              <Link href="/history" className="flex-1 sm:flex-none">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-50 w-full">
                  歷史紀錄
                </Button>
              </Link>
            </div>

            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>掃描進度</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full"
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

        {/* 訊號統計摘要 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-xs md:text-sm font-medium">攻擊K線</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                    {signalStats.attackK}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-xs md:text-sm font-medium">多頭吞噬</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                    {signalStats.bullishEngulfing}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-xs md:text-sm font-medium">黑K吞噬</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                    {signalStats.bearishEngulfing}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-xs md:text-sm font-medium">內困型態</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                    {signalStats.harami}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 投資建議名單 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">投資建議名單</CardTitle>
            <CardDescription>今日掃描出的投資機會</CardDescription>
          </CardHeader>
          <CardContent>
            {scanResults.length === 0 ? (
              <Alert className="border-slate-200 bg-slate-50">
                <AlertCircle className="h-4 w-4 text-slate-600" />
                <AlertDescription className="text-slate-600">
                  暫無掃描結果。請點擊「開始掃描」按鈕執行全市場掃描。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-transparent">
                      <TableHead className="text-slate-700 font-semibold">股票代號</TableHead>
                      <TableHead className="text-slate-700 font-semibold">股票名稱</TableHead>
                      <TableHead className="text-slate-700 font-semibold">產業</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">收盤價</TableHead>
                      <TableHead className="text-slate-700 font-semibold">技術訊號</TableHead>
                      <TableHead className="text-slate-700 font-semibold">季線之上</TableHead>
                      <TableHead className="text-slate-700 font-semibold">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanResults.map((result) => (
                      <TableRow key={result.id} className="border-slate-100 hover:bg-slate-50">
                        <TableCell className="font-semibold text-slate-900">{result.stockId}</TableCell>
                        <TableCell className="text-slate-700">{result.stockName}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{result.industry || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          ${result.closePrice}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">{result.signalType}</Badge>
                        </TableCell>
                        <TableCell>
                          {result.aboveMa60 === 1 ? (
                            <Badge className="bg-green-100 text-green-800">是</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">否</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/kline/${result.stockId}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              查看K線
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
