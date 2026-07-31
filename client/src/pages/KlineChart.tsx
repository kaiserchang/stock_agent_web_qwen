import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, Label } from "recharts";
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

interface EnhancedKlineData extends KlineData {
  ma20?: number;
  ma60?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

// 技術指標計算函數
const calculateRSI = (data: KlineData[], period: number = 14): (number | undefined)[] => {
  const rsi: (number | undefined)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(undefined);
      continue;
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j].close - data[j - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push(rsiValue);
  }
  
  return rsi;
};

const calculateMACD = (data: KlineData[]): { macd: (number | undefined)[]; signal: (number | undefined)[]; histogram: (number | undefined)[] } => {
  const ema12 = calculateEMA(data.map(d => d.close), 12);
  const ema26 = calculateEMA(data.map(d => d.close), 26);
  
  const macd = ema12.map((v, i) => v !== undefined && ema26[i] !== undefined ? v - ema26[i] : undefined);
  const signal = calculateEMA(macd.filter(v => v !== undefined) as number[], 9);
  
  const histogram = macd.map((v, i) => {
    if (v === undefined || signal[i] === undefined) return undefined;
    return v - signal[i];
  });
  
  return { macd, signal, histogram };
};

const calculateEMA = (data: number[], period: number): (number | undefined)[] => {
  const ema: (number | undefined)[] = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += data[i];
  }
  
  const sma = sum / Math.min(period, data.length);
  ema[period - 1] = sma;
  
  for (let i = period; i < data.length; i++) {
    const emaValue = (data[i] - (ema[i - 1] || 0)) * multiplier + (ema[i - 1] || 0);
    ema[i] = emaValue;
  }
  
  return ema;
};

const calculateBollingerBands = (data: KlineData[], period: number = 20, stdDev: number = 2): { upper: (number | undefined)[]; middle: (number | undefined)[]; lower: (number | undefined)[] } => {
  const middle = calculateMA(data, period);
  const upper: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || middle[i] === undefined) {
      upper.push(undefined);
      lower.push(undefined);
      continue;
    }
    
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += Math.pow(data[j].close - (middle[i] || 0), 2);
    }
    
    const std = Math.sqrt(variance / period);
    upper.push((middle[i] || 0) + stdDev * std);
    lower.push((middle[i] || 0) - stdDev * std);
  }
  
  return { upper, middle, lower };
};

const calculateMA = (data: KlineData[], period: number): (number | undefined)[] => {
  return data.map((item, index) => {
    if (index < period - 1) return undefined;
    const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0);
    return sum / period;
  });
};

export default function KlineChart() {
  const { stockId } = useParams<{ stockId: string }>();
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  });
  const [hoveredData, setHoveredData] = useState<EnhancedKlineData | null>(null);
  const [period, setPeriod] = useState<"1d" | "1w" | "1m">("1d"); // 週期切換
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [showBB, setShowBB] = useState(true);

  // 初始化日期範圍
  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    
    switch (period) {
      case "1w":
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000); // 1年
        break;
      case "1m":
        startDate = new Date(today.getTime() - 3 * 365 * 24 * 60 * 60 * 1000); // 3年
        break;
      default:
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000); // 90天
    }
    
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = today.toISOString().split("T")[0];
    
    setDateRange({ startDate: startDateStr, endDate: endDateStr });
  }, [period]);

  // 獲取 K 線數據
  const getKlineDataQuery = trpc.stock.getKlineData.useQuery(
    {
      stockId: stockId || "",
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      enabled: !!(stockId && dateRange.startDate && dateRange.endDate),
    }
  );

  useEffect(() => {
    if (getKlineDataQuery.data) {
      const data = getKlineDataQuery.data as any;
      const klines = data.klines || data.data || [];
      if (data.status === "success" && klines && klines.length > 0) {
        const formattedData = klines.map((kline: any) => ({
          date: kline.Date || kline.date,
          open: parseFloat(kline.Open || kline.open),
          high: parseFloat(kline.High || kline.high),
          low: parseFloat(kline.Low || kline.low),
          close: parseFloat(kline.Close || kline.close),
          volume: parseFloat(kline.Volume || kline.volume),
          signal: kline.Signal || kline.signal || null,
        }));
        setKlineData(formattedData);
      }
    }
  }, [getKlineDataQuery.data]);

  // 計算技術指標
  const enhancedData = useMemo(() => {
    if (klineData.length === 0) return [];
    
    const ma20 = calculateMA(klineData, 20);
    const ma60 = calculateMA(klineData, 60);
    const rsi = calculateRSI(klineData, 14);
    const { macd, signal, histogram } = calculateMACD(klineData);
    const { upper, middle, lower } = calculateBollingerBands(klineData, 20, 2);
    
    return klineData.map((item, index) => ({
      ...item,
      ma20: ma20[index],
      ma60: ma60[index],
      rsi: rsi[index],
      macd: macd[index],
      macdSignal: signal[index],
      macdHistogram: histogram[index],
      bbUpper: upper[index],
      bbMiddle: middle[index],
      bbLower: lower[index],
    }));
  }, [klineData]);

  // 統計訊號
  const signalCounts = klineData.reduce((acc, item) => {
    if (item.signal) {
      acc[item.signal] = (acc[item.signal] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // 自訂 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 p-4 border border-slate-600 rounded shadow-lg">
          <p className="text-sm font-semibold text-amber-400">{data.date}</p>
          <p className="text-xs text-slate-300">開盤: NT${data.open.toFixed(2)}</p>
          <p className="text-xs text-slate-300">最高: NT${data.high.toFixed(2)}</p>
          <p className="text-xs text-slate-300">最低: NT${data.low.toFixed(2)}</p>
          <p className="text-xs text-slate-300">收盤: NT${data.close.toFixed(2)}</p>
          <p className="text-xs text-slate-300 mt-2">成交量: {(data.volume / 1000000).toFixed(2)}M</p>
          {data.rsi && <p className="text-xs text-cyan-300">RSI: {data.rsi.toFixed(2)}</p>}
          {data.macd && <p className="text-xs text-cyan-300">MACD: {data.macd.toFixed(4)}</p>}
          {data.signal && (
            <p className="text-xs font-semibold text-cyan-300 mt-2 border-t border-slate-600 pt-2">
              🔔 訊號: {data.signal}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 返回按鈕 */}
        <Link href="/">
          <Button variant="ghost" className="mb-4 text-cyan-300 hover:text-cyan-200 hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回儀表板
          </Button>
        </Link>

        {/* 頁面標題 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-amber-400">股票代號：{stockId}</h1>
          <p className="text-slate-300">
            {dateRange.startDate} 至 {dateRange.endDate} 技術分析 K 線圖
          </p>
        </div>

        {/* K 線圖表卡片 */}
        <Card className="border-0 shadow-lg bg-slate-800">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-amber-400">K 線圖表</CardTitle>
                <CardDescription className="text-slate-300">
                  紅色K線為上漲，黑色K線為下跌。黃色為20日均線，紅色為60日均線（季線）。
                  {klineData.length > 0 && <span className="ml-2 text-xs text-slate-400">已加載 {klineData.length} 筆數據</span>}
                </CardDescription>
              </div>
              
              {/* 週期切換按鈕 */}
              <div className="flex gap-2">
                <Button
                  variant={period === "1d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("1d")}
                  className={period === "1d" ? "bg-blue-600" : ""}
                >
                  日線
                </Button>
                <Button
                  variant={period === "1w" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("1w")}
                  className={period === "1w" ? "bg-blue-600" : ""}
                >
                  週線
                </Button>
                <Button
                  variant={period === "1m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod("1m")}
                  className={period === "1m" ? "bg-blue-600" : ""}
                >
                  月線
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {getKlineDataQuery.isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-400">載入中...</p>
                </div>
              </div>
            ) : klineData.length === 0 ? (
              <Alert className="border-slate-600 bg-slate-800">
                <AlertCircle className="h-4 w-4 text-slate-300" />
                <AlertDescription className="text-slate-200">
                  無法取得該股票的 K 線數據。請確認股票代號是否正確。
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* 訊號統計 */}
                {Object.keys(signalCounts).length > 0 && (
                  <div className="bg-slate-800 border border-cyan-400 rounded-lg p-4">
                    <p className="text-sm font-semibold text-cyan-300 mb-2">檢測到的技術訊號：</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(signalCounts).map(([signal, count]) => (
                        <span key={signal} className="bg-cyan-900 text-cyan-200 px-3 py-1 rounded text-sm">
                          {signal}: {count} 次
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 技術指標切換 */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={showRSI ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRSI(!showRSI)}
                    className={showRSI ? "bg-purple-600" : ""}
                  >
                    RSI
                  </Button>
                  <Button
                    variant={showMACD ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowMACD(!showMACD)}
                    className={showMACD ? "bg-orange-600" : ""}
                  >
                    MACD
                  </Button>
                  <Button
                    variant={showBB ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowBB(!showBB)}
                    className={showBB ? "bg-green-600" : ""}
                  >
                    布林帶
                  </Button>
                </div>

                {/* K 線圖表 */}
                <ResponsiveContainer width="100%" height={500}>
                  <ComposedChart 
                    data={enhancedData} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    onMouseMove={(state: any) => {
                      if (state && state.isTooltipActive && state.activeTooltipIndex !== undefined) {
                        const data = enhancedData[state.activeTooltipIndex];
                        if (data) setHoveredData(data);
                      }
                    }}
                    onMouseLeave={() => setHoveredData(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#cbd5e1' }}
                      interval={Math.max(0, Math.floor(enhancedData.length / 15))}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: '#cbd5e1' }}
                      label={{ value: "股價 (NT$)", angle: -90, position: "insideLeft", fill: '#cbd5e1' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: '#cbd5e1' }}
                      label={{ value: "成交量", angle: 90, position: "insideRight", fill: '#cbd5e1' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Legend />

                    {/* 成交量 */}
                    <Bar
                      yAxisId="right"
                      dataKey="volume"
                      fill="#cbd5e1"
                      name="成交量"
                      opacity={0.4}
                    />

                    {/* 收盤價線（K線表示） */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="close"
                      stroke="#3b82f6"
                      dot={false}
                      name="收盤價"
                      strokeWidth={2}
                      isAnimationActive={false}
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

                    {/* 60日均線 */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ma60"
                      stroke="#ef4444"
                      dot={false}
                      name="60日均線"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                    />

                    {/* 布林帶 */}
                    {showBB && (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="bbUpper"
                          stroke="#10b981"
                          dot={false}
                          name="布林帶上軌"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                          isAnimationActive={false}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="bbMiddle"
                          stroke="#06b6d4"
                          dot={false}
                          name="布林帶中軌"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                          isAnimationActive={false}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="bbLower"
                          stroke="#f59e0b"
                          dot={false}
                          name="布林帶下軌"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                          isAnimationActive={false}
                        />
                      </>
                    )}

                    {/* 買進訊號 */}
                    {enhancedData.map((item, index) => {
                      if (item.signal === '買進訊號') {
                        return (
                          <ReferenceDot
                            key={`buy-${index}`}
                            x={item.date}
                            y={item.low}
                            r={6}
                            fill="#22c55e"
                            stroke="#16a34a"
                            strokeWidth={2}
                          >
                            <Label value="↑ 買" position="top" fill="#22c55e" fontSize={12} fontWeight="bold" />
                          </ReferenceDot>
                        );
                      }
                      return null;
                    })}

                    {/* 賣出訊號 */}
                    {enhancedData.map((item, index) => {
                      if (item.signal === '賣出訊號') {
                        return (
                          <ReferenceDot
                            key={`sell-${index}`}
                            x={item.date}
                            y={item.high}
                            r={6}
                            fill="#ef4444"
                            stroke="#dc2626"
                            strokeWidth={2}
                          >
                            <Label value="↓ 賣" position="top" fill="#ef4444" fontSize={12} fontWeight="bold" />
                          </ReferenceDot>
                        );
                      }
                      return null;
                    })}
                  </ComposedChart>
                </ResponsiveContainer>

                {/* 懸停信息 */}
                {hoveredData && (
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-400 mb-2">詳細信息：{hoveredData.date}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">開盤價</p>
                        <p className="text-cyan-300 font-semibold">NT${hoveredData.open.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">收盤價</p>
                        <p className="text-cyan-300 font-semibold">NT${hoveredData.close.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">最高價</p>
                        <p className="text-cyan-300 font-semibold">NT${hoveredData.high.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">最低價</p>
                        <p className="text-cyan-300 font-semibold">NT${hoveredData.low.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">成交量</p>
                        <p className="text-cyan-300 font-semibold">{(hoveredData.volume / 1000000).toFixed(2)}M</p>
                      </div>
                      <div>
                        <p className="text-slate-400">漲跌</p>
                        <p className={hoveredData.close >= hoveredData.open ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
                          {(hoveredData.close - hoveredData.open).toFixed(2)} ({((hoveredData.close - hoveredData.open) / hoveredData.open * 100).toFixed(2)}%)
                        </p>
                      </div>
                      {hoveredData.rsi && (
                        <div>
                          <p className="text-slate-400">RSI(14)</p>
                          <p className="text-purple-300 font-semibold">{hoveredData.rsi.toFixed(2)}</p>
                        </div>
                      )}
                      {hoveredData.macd && (
                        <div>
                          <p className="text-slate-400">MACD</p>
                          <p className="text-orange-300 font-semibold">{hoveredData.macd.toFixed(4)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 技術指標說明 */}
        <Card className="border-0 shadow-md bg-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-amber-400">技術指標說明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-3">
            <div>
              <p className="font-semibold text-cyan-300">RSI（相對強度指數）</p>
              <p>衡量股票超買超賣情況。RSI &gt; 70 表示超買，RSI &lt; 30 表示超賣。</p>
            </div>
            <div>
              <p className="font-semibold text-orange-300">MACD（指數平滑異同移動平均線）</p>
              <p>由快速 EMA(12) 和慢速 EMA(26) 的差值組成。MACD 穿過信號線時產生交易訊號。</p>
            </div>
            <div>
              <p className="font-semibold text-green-300">布林帶（Bollinger Bands）</p>
              <p>由中軌（20日均線）和上下軌（±2個標準差）組成。股價觸及上下軌時可能出現反轉。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
