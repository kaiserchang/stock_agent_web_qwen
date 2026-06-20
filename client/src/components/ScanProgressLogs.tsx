import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScanProgressLogsProps {
  sessionId: number;
  isScanning: boolean;
}

export default function ScanProgressLogs({ sessionId, isScanning }: ScanProgressLogsProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 查詢掃描日誌
  const { data: scanLogs, isLoading } = trpc.stock.getScanLogs.useQuery(
    { sessionId },
    {
      enabled: !!sessionId,
      refetchInterval: isScanning && autoRefresh ? 1000 : false, // 掃描中時每秒刷新
    }
  );

  useEffect(() => {
    if (scanLogs) {
      setLogs(scanLogs);
    }
  }, [scanLogs]);

  // 統計各狀態的數量
  const stats = {
    pending: logs.filter((log) => log.status === "pending").length,
    scanning: logs.filter((log) => log.status === "scanning").length,
    completed: logs.filter((log) => log.status === "completed").length,
    failed: logs.filter((log) => log.status === "failed").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />;
      case "scanning":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">待掃描</Badge>;
      case "scanning":
        return <Badge className="bg-blue-100 text-blue-800">掃描中</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">失敗</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">掃描進度日誌</CardTitle>
        <CardDescription>實時顯示每檔股票的掃描狀態</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 統計摘要 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 bg-gray-50 rounded text-center">
            <div className="text-sm text-gray-600">待掃描</div>
            <div className="text-lg font-semibold">{stats.pending}</div>
          </div>
          <div className="p-2 bg-blue-50 rounded text-center">
            <div className="text-sm text-blue-600">掃描中</div>
            <div className="text-lg font-semibold text-blue-700">{stats.scanning}</div>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <div className="text-sm text-green-600">已完成</div>
            <div className="text-lg font-semibold text-green-700">{stats.completed}</div>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <div className="text-sm text-red-600">失敗</div>
            <div className="text-lg font-semibold text-red-700">{stats.failed}</div>
          </div>
        </div>

        {/* 日誌列表 */}
        <ScrollArea className="h-96 w-full border rounded-md p-4">
          {isLoading && !logs.length ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>暫無掃描日誌</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  {getStatusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{log.stockId}</span>
                      <span className="text-xs text-gray-500">{log.stockName}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    {log.signalType && (
                      <div className="text-xs text-gray-600 mt-1">
                        訊號: <span className="font-medium">{log.signalType}</span>
                      </div>
                    )}
                    {log.message && (
                      <div className="text-xs text-gray-500 mt-1">{log.message}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(log.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 自動刷新控制 */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="autoRefresh" className="text-sm text-gray-600">
            自動刷新日誌
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
