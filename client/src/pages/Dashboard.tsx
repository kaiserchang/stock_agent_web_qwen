import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Zap, Activity, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // 獲取最新掃描結果
  const latestResults = trpc.stock.getLatestScanResults.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 開始掃描 mutation
  const startScanMutation = trpc.stock.startScan.useMutation({
    onSuccess: (data) => {
      setIsScanning(true);
      setScanProgress(0);
      // 開始輪詢進度
      const interval = setInterval(() => {
        latestResults.refetch();
      }, 2000); // 每 2 秒查詢一次進度
      setPollInterval(interval);
    },
    onError: (error) => {
      console.error("Scan failed:", error);
      setIsScanning(false);
    },
  });

  useEffect(() => {
    if (isScanning && latestResults.data?.session) {
      const progress = latestResults.data.session.progress || 0;
      setScanProgress(progress);
      
      if (progress === 100 || progress === -1) {
        setIsScanning(false);
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      }
    }
  }, [latestResults.data?.session?.progress]);

  const handleStartScan = () => {
    startScanMutation.mutate({
      scanLimit: 50, // 預設掃描前 50 檔股票
    });
  };

  const handleViewKline = (stockId: string) => {
    setLocation(`/kline/${stockId}`);
  };

  const session = latestResults.data?.session;
  const results = latestResults.data?.results || [];

  // 計算訊號統計
  const signalStats = results.reduce((acc, result) => {
    const signal = result.signalType;
    acc[signal] = (acc[signal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 訊號類型對應的圖示與顏色
  const signalConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    "攻擊K線": { icon: <Zap className="w-4 h-4" />, color: "bg-red-500", label: "攻擊K線" },
    "多頭吞噬": { icon: <TrendingUp className="w-4 h-4" />, color: "bg-green-500", label: "多頭吞噬" },
    "黑K吞噬": { icon: <AlertCircle className="w-4 h-4" />, color: "bg-orange-500", label: "黑K吞噬" },
    "內困型態": { icon: <Activity className="w-4 h-4" />, color: "bg-blue-500", label: "內困型態" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 頁面標題 */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">台股技術分析儀表板</h1>
          <p className="text-slate-600">基於林家洋老師的技術分析理論，自動掃描台灣股市投資機會</p>
        </div>

        {/* 掃描控制區 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">掃描控制</CardTitle>
            <CardDescription>開始全市場技術訊號掃描</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleStartScan}
                disabled={isScanning || startScanMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isScanning ? "掃描中..." : "開始掃描"}
              </Button>
              <Link href="/settings">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                  掃描設定
                </Button>
              </Link>
            </div>

            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">掃描進度</span>
                  <span className="font-semibold text-slate-900">{Math.round(scanProgress)}%</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            )}

            {session && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  最後掃描時間：{format(new Date(session.scanStartTime), "yyyy-MM-dd HH:mm:ss")} | 掃描股票數：{session.totalScannedStocks} | 建議數：{session.recommendationCount}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 訊號統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(signalConfig).map(([signalType, config]) => (
            <Card key={signalType} className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{config.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{signalStats[signalType] || 0}</p>
                  </div>
                  <div className={`${config.color} p-3 rounded-lg text-white`}>
                    {config.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 投資建議名單表格 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-4 border-b border-slate-200">
            <CardTitle className="text-lg">投資建議名單</CardTitle>
            <CardDescription>今日掃描出的技術訊號推薦</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results.length === 0 ? (
              <Alert className="border-slate-200 bg-slate-50">
                <AlertCircle className="h-4 w-4 text-slate-600" />
                <AlertDescription className="text-slate-700">
                  暫無掃描結果。請點擊「開始掃描」按鈕進行全市場掃描。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 hover:bg-transparent">
                      <TableHead className="text-slate-700 font-semibold">股票代號</TableHead>
                      <TableHead className="text-slate-700 font-semibold">股票名稱</TableHead>
                      <TableHead className="text-slate-700 font-semibold">產業</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">收盤價</TableHead>
                      <TableHead className="text-slate-700 font-semibold">技術訊號類型</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-center">是否位於季線之上</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                        <TableCell className="font-semibold text-slate-900">{result.stockId}</TableCell>
                        <TableCell className="text-slate-700">{result.stockName}</TableCell>
                        <TableCell className="text-slate-600">{result.industry}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">NT${result.closePrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={`${signalConfig[result.signalType]?.color || "bg-gray-500"} text-white`}>
                            {result.signalType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={result.aboveMa60 ? "default" : "secondary"}>
                            {result.aboveMa60 ? "是" : "否"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewKline(result.stockId)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            查看K線
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
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
