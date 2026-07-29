import React, { useEffect, useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertCircle, Clock, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScanProgressLogsProps {
  sessionId: number;
  isScanning: boolean;
}

export default function ScanProgressLogs({ sessionId, isScanning }: ScanProgressLogsProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // 篩選狀態
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [signalTypeFilter, setSignalTypeFilter] = useState<string[]>([]);

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

  // 應用篩選邏輯
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 搜尋篩選（股票代號或名稱）
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !log.stockId.toLowerCase().includes(query) &&
          !log.stockName.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 狀態篩選
      if (statusFilter.length > 0 && !statusFilter.includes(log.status)) {
        return false;
      }

      // 訊號類型篩選
      if (signalTypeFilter.length > 0) {
        if (!log.signalType || !signalTypeFilter.includes(log.signalType)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, statusFilter, signalTypeFilter]);

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

  const getSignalBadge = (signalType: string) => {
    switch (signalType) {
      case "攻擊K線":
        return <Badge className="bg-red-100 text-red-800">攻擊K線</Badge>;
      case "多頭吞噬":
        return <Badge className="bg-green-100 text-green-800">多頭吞噬</Badge>;
      case "黑K吞噬":
        return <Badge className="bg-yellow-100 text-yellow-800">黑K吞噬</Badge>;
      case "內困型態":
        return <Badge className="bg-blue-100 text-blue-800">內困型態</Badge>;
      default:
        return null;
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleSignalTypeFilter = (signalType: string) => {
    setSignalTypeFilter((prev) =>
      prev.includes(signalType)
        ? prev.filter((s) => s !== signalType)
        : [...prev, signalType]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setSignalTypeFilter([]);
  };

  const hasActiveFilters = searchQuery || statusFilter.length > 0 || signalTypeFilter.length > 0;

  return (
    <Card className="w-full border-0 shadow-lg bg-slate-800">
      <CardHeader>
        <CardTitle className="text-lg">掃描進度日誌</CardTitle>
        <CardDescription>實時顯示每檔股票的掃描狀態，支援篩選與搜尋</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 統計摘要 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-3 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors">
            <div className="text-xs md:text-sm text-gray-600 font-medium">待掃描</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stats.pending}</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
            <div className="text-xs md:text-sm text-blue-600 font-medium">掃描中</div>
            <div className="text-xl md:text-2xl font-bold text-blue-700 mt-1">{stats.scanning}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
            <div className="text-xs md:text-sm text-green-600 font-medium">已完成</div>
            <div className="text-xl md:text-2xl font-bold text-green-700 mt-1">{stats.completed}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center hover:bg-red-100 transition-colors">
            <div className="text-xs md:text-sm text-red-600 font-medium">失敗</div>
            <div className="text-xl md:text-2xl font-bold text-red-700 mt-1">{stats.failed}</div>
          </div>
        </div>

        {/* 搜尋與篩選區 */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
          {/* 搜尋框 */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">搜尋股票</label>
            <Input
              placeholder="輸入股票代號或名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 狀態篩選 */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">按狀態篩選</label>
            <div className="flex flex-wrap gap-2">
              {["pending", "scanning", "completed", "failed"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter.includes(status) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStatusFilter(status)}
                  className={
                    statusFilter.includes(status)
                      ? status === "pending"
                        ? "bg-gray-500"
                        : status === "scanning"
                        ? "bg-blue-500"
                        : status === "completed"
                        ? "bg-green-500"
                        : "bg-red-500"
                      : ""
                  }
                >
                  {status === "pending"
                    ? "待掃描"
                    : status === "scanning"
                    ? "掃描中"
                    : status === "completed"
                    ? "已完成"
                    : "失敗"}
                </Button>
              ))}
            </div>
          </div>

          {/* 訊號類型篩選 */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">按訊號類型篩選</label>
            <div className="flex flex-wrap gap-2">
              {["攻擊K線", "多頭吞噬", "黑K吞噬", "內困型態"].map((signalType) => (
                <Button
                  key={signalType}
                  variant={signalTypeFilter.includes(signalType) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSignalTypeFilter(signalType)}
                  className={
                    signalTypeFilter.includes(signalType)
                      ? signalType === "攻擊K線"
                        ? "bg-red-500"
                        : signalType === "多頭吞噬"
                        ? "bg-green-500"
                        : signalType === "黑K吞噬"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                      : ""
                  }
                >
                  {signalType}
                </Button>
              ))}
            </div>
          </div>

          {/* 清除篩選按鈕 */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-slate-600 hover:text-slate-900"
            >
              <X className="h-4 w-4 mr-1" />
              清除所有篩選
            </Button>
          )}
        </div>

        {/* 日誌列表 */}
        <div className="text-sm text-slate-600 mb-2">
          顯示 {filteredLogs.length} / {logs.length} 筆日誌
        </div>
        <ScrollArea className="h-96 w-full border border-slate-200 rounded-lg p-4 bg-slate-800">
          {isLoading && !logs.length ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>{logs.length === 0 ? "暫無掃描日誌" : "沒有符合篩選條件的日誌"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div
                  key={`${log.sessionId}-${log.stockId}-${log.timestamp}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  {getStatusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">{log.stockId}</span>
                      <span className="text-xs text-slate-500">{log.stockName}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    {log.signalType && (
                      <div className="text-xs text-slate-600 mt-2 flex items-center gap-2">
                        <span>訊號:</span>
                        {getSignalBadge(log.signalType)}
                      </div>
                    )}
                    {log.message && (
                      <div className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                        {log.message}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 自動刷新控制 */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 cursor-pointer"
          />
          <label htmlFor="autoRefresh" className="text-sm text-slate-600 cursor-pointer">
            掃描中自動刷新日誌
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
