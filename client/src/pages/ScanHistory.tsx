"use client";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

interface ScanResult {
  id?: number;
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

export default function ScanHistory() {
  const [selectedSession, setSelectedSession] = useState<ScanSession | null>(null);
  const [sessionResults, setSessionResults] = useState<ScanResult[]>([]);

  // 獲取掃描歷史
  const scanHistoryQuery = trpc.stock.getScanHistory.useQuery(undefined, {
    enabled: true,
  });

  // 獲取特定 session 的詳細結果
  const sessionDetailsQuery = trpc.stock.getScanSessionDetails.useQuery(
    { sessionId: selectedSession?.id.toString() || "" },
    { enabled: !!selectedSession }
  );

  useEffect(() => {
    if (sessionDetailsQuery.data) {
      setSessionResults(sessionDetailsQuery.data || []);
    }
  }, [sessionDetailsQuery.data]);

  const sessions = (scanHistoryQuery.data || []) as any[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 返回按鈕 */}
        <Link href="/">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回儀表板
          </Button>
        </Link>

        {/* 標題 */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">掃描結果歷史紀錄</h1>
          <p className="text-slate-600 text-sm md:text-base">查閱過去各日的投資建議名單與掃描結果</p>
        </div>

        {/* 主要內容區 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：掃描歷史列表 */}
          <Card className="border-0 shadow-lg bg-white lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">掃描歷史</CardTitle>
              <CardDescription>點擊查看詳細結果</CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistoryQuery.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-slate-600 text-sm">載入歷史紀錄中...</p>
                </div>
              ) : sessions.length === 0 ? (
                <Alert className="border-slate-200 bg-slate-50">
                  <AlertCircle className="h-4 w-4 text-slate-600" />
                  <AlertDescription className="text-slate-700 text-sm">
                    暫無掃描歷史紀錄
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedSession?.id === session.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold text-sm text-slate-900">
                        {format(new Date(session.scanStartTime), "yyyy-MM-dd HH:mm")}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        掃描：{session.totalScannedStocks || 0} 檔 | 建議：{session.recommendationCount || 0} 檔
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右側：詳細結果 */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(new Date(selectedSession.scanStartTime), "yyyy-MM-dd HH:mm:ss")} 掃描結果
                  </CardTitle>
                  <CardDescription>
                    掃描股票數：{selectedSession.totalScannedStocks || 0} | 建議數：{selectedSession.recommendationCount || 0}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionDetailsQuery.isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-slate-600 text-sm">載入詳細結果中...</p>
                    </div>
                  ) : sessionResults.length === 0 ? (
                    <Alert className="border-slate-200 bg-slate-50">
                      <AlertCircle className="h-4 w-4 text-slate-600" />
                      <AlertDescription className="text-slate-700 text-sm">
                        該掃描期間無投資建議
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-200 hover:bg-transparent">
                            <TableHead className="text-slate-700 font-semibold text-xs">股票代號</TableHead>
                            <TableHead className="text-slate-700 font-semibold text-xs">股票名稱</TableHead>
                            <TableHead className="text-slate-700 font-semibold text-xs hidden sm:table-cell">產業</TableHead>
                            <TableHead className="text-slate-700 font-semibold text-xs text-right">收盤價</TableHead>
                            <TableHead className="text-slate-700 font-semibold text-xs">技術訊號</TableHead>
                            <TableHead className="text-slate-700 font-semibold text-xs text-center">季線之上</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessionResults.map((result, idx) => (
                            <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                              <TableCell className="font-semibold text-slate-900 text-xs">{result.stockId}</TableCell>
                              <TableCell className="text-slate-700 text-xs">{result.stockName}</TableCell>
                              <TableCell className="text-slate-600 text-xs hidden sm:table-cell">{result.industry}</TableCell>
                              <TableCell className="text-right font-semibold text-slate-900 text-xs">
                                NT${result.closePrice.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-xs">
                                <Badge className="bg-blue-500 text-white text-xs">
                                  {result.signalType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={result.aboveMa60 ? "default" : "secondary"} className="text-xs">
                                  {result.aboveMa60 ? "是" : "否"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white h-full flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 text-sm">
                    請選擇左側的掃描紀錄查看詳細結果
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
