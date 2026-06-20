import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Link } from "wouter";

interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  signal?: string;
}

export default function KlineChart() {
  const { isAuthenticated } = useAuth();
  const { stockId } = useParams<{ stockId: string }>();
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  });

  // 初始化日期範圍
  useEffect(() => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const startDate = ninetyDaysAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];
    
    setDateRange({ startDate, endDate });
  }, []);

  // 獲取 K 線數據 - 使用 useQuery
  const getKlineDataQuery = trpc.stock.getKlineData.useQuery(
    {
      stockId: stockId || "",
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      enabled: !!(stockId && dateRange.startDate && dateRange.endDate && isAuthenticated),
    }
  );

  // 監聽查詢結果
  useEffect(() => {
    if (getKlineDataQuery.data) {
      const data = getKlineDataQuery.data as any;
      if (data.status === "success" && data.klines) {
        const formattedData = data.klines.map((kline: any) => ({
          date: kline.date,
          open: parseFloat(kline.open),
          high: parseFloat(kline.high),
          low: parseFloat(kline.low),
          close: parseFloat(kline.close),
          volume: parseFloat(kline.volume),
          signal: kline.signal || null,
        }));
        setKlineData(formattedData);
      }
    }
  }, [getKlineDataQuery.data]);

  // 計算均線（20日、60日）
  const calculateMA = (data: KlineData[], period: number) => {
    return data.map((item, index) => {
      if (index < period - 1) return null;
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0);
      return sum / period;
    });
  };

  const ma20 = calculateMA(klineData, 20);
  const ma60 = calculateMA(klineData, 60);

  // 為數據添加均線
  const dataWithMA = klineData.map((item, index) => ({
    ...item,
    ma20: ma20[index],
    ma60: ma60[index],
  }));

  // 統計訊號數量
  const signalCounts = klineData.reduce((acc, item) => {
    if (item.signal) {
      acc[item.signal] = (acc[item.signal] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // 自訂 Tooltip 以顯示 K 線詳細信息
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-300 rounded shadow-lg">
          <p className="text-sm font-semibold text-slate-900">{data.date}</p>
          <p className="text-xs text-slate-600">開盤: NT${data.open.toFixed(2)}</p>
          <p className="text-xs text-slate-600">最高: NT${data.high.toFixed(2)}</p>
          <p className="text-xs text-slate-600">最低: NT${data.low.toFixed(2)}</p>
          <p className="text-xs text-slate-600">收盤: NT${data.close.toFixed(2)}</p>
          {data.signal && (
            <p className="text-xs font-semibold text-blue-600 mt-2 border-t border-slate-200 pt-2">
              🔔 訊號: {data.signal}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 返回按鈕 */}
        <Link href="/">
          <Button variant="ghost" className="mb-4 text-slate-700 hover:text-slate-900 hover:bg-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回儀表板
          </Button>
        </Link>

        {/* 頁面標題 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">股票代號：{stockId}</h1>
          <p className="text-slate-600">
            {dateRange.startDate} 至 {dateRange.endDate} 技術分析 K 線圖
          </p>
        </div>

        {/* 錯誤提示 */}
        {getKlineDataQuery.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              無法載入 K 線數據：{(getKlineDataQuery.error as any)?.message || "未知錯誤"}
            </AlertDescription>
          </Alert>
        )}

        {/* K 線圖表卡片 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">K 線圖表</CardTitle>
            <CardDescription>
              藍色線為收盤價，黃色為20日均線，紅色為60日均線（季線）。圖上標註了技術訊號位置。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getKlineDataQuery.isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">載入中...</p>
                </div>
              </div>
            ) : klineData.length === 0 ? (
              <Alert className="border-slate-200 bg-slate-50">
                <AlertCircle className="h-4 w-4 text-slate-600" />
                <AlertDescription className="text-slate-700">
                  無法取得該股票的 K 線數據。請確認股票代號是否正確。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* 訊號統計 */}
                {Object.keys(signalCounts).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">檢測到的技術訊號：</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(signalCounts).map(([signal, count]) => (
                        <span key={signal} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                          {signal}: {count} 次
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* K 線圖表 */}
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={dataWithMA} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      interval={Math.max(0, Math.floor(dataWithMA.length / 15))}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                      label={{ value: "股價 (NT$)", angle: -90, position: "insideLeft" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      label={{ value: "成交量", angle: 90, position: "insideRight" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    {/* 成交量柱狀圖 */}
                    <Bar
                      yAxisId="right"
                      dataKey="volume"
                      fill="#cbd5e1"
                      name="成交量"
                      opacity={0.4}
                    />

                    {/* 收盤價線圖 */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="close"
                      stroke="#3b82f6"
                      dot={false}
                      name="收盤價"
                      strokeWidth={2}
                    />

                    {/* 20日均線 */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ma20"
                      stroke="#eab308"
                      dot={false}
                      name="20日均線"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                    />

                    {/* 60日均線（季線） */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ma60"
                      stroke="#ef4444"
                      dot={false}
                      name="60日均線（季線）"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 訊號說明卡片 */}
        <Card className="border-0 shadow-md bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">技術訊號說明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-3">
            <div className="border-l-4 border-red-500 pl-3">
              <p className="font-semibold text-red-700">攻擊K線</p>
              <p className="text-slate-600">股價大幅上漲（&gt;3%），成交量明顯放大（&gt;5日均量1.5倍），表示主力表態看多。</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <p className="font-semibold text-green-700">多頭吞噬</p>
              <p className="text-slate-600">當日K線開盤價低於前一日收盤價，但收盤價高於前一日開盤價，表示多方力量強勁。</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-3">
              <p className="font-semibold text-orange-700">黑K吞噬</p>
              <p className="text-slate-600">當日K線為黑K（下跌），且完全吞噬前一日的紅K（上漲），表示空方力量強勁。</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="font-semibold text-blue-700">內困型態</p>
              <p className="text-slate-600">當日K線的開盤價和收盤價都在前一日K線的範圍內，表示力量暫時受阻。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
