import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ma60?: number;
  rsi?: number;
  macd?: number;
  signal?: string;
}

interface CandlestickChartProps {
  data: CandleData[];
  showRSI?: boolean;
  showMACD?: boolean;
  showBB?: boolean;
  onMouseMove?: (data: CandleData | null) => void;
  onMouseLeave?: () => void;
  CustomTooltip?: React.ComponentType<any>;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  showRSI = false,
  showMACD = false,
  showBB = false,
  onMouseMove,
  onMouseLeave,
  CustomTooltip,
}) => {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <ComposedChart 
        data={data} 
        margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        onMouseMove={(state: any) => {
          if (state && state.isTooltipActive && state.activeTooltipIndex !== undefined) {
            const candleData = data[state.activeTooltipIndex];
            if (candleData && onMouseMove) {
              onMouseMove(candleData);
            }
          }
        }}
        onMouseLeave={() => {
          if (onMouseLeave) onMouseLeave();
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#cbd5e1' }}
          interval={Math.max(0, Math.floor(data.length / 15))}
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
          content={CustomTooltip as any}
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
          strokeWidth={2}
          name="收盤價"
        />

        {/* 20日均線 */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="ma20"
          stroke="#fbbf24"
          dot={false}
          strokeWidth={2}
          name="20日均線"
        />

        {/* 60日均線 */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="ma60"
          stroke="#f87171"
          dot={false}
          strokeWidth={2}
          name="60日均線"
        />

        {/* 買進訊號 */}
        {data.map((d, idx) => 
          d.signal === '買進' ? (
            <ReferenceDot
              key={`buy-${idx}`}
              x={d.date}
              y={d.close}
              r={6}
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth={2}
            />
          ) : null
        )}

        {/* 賣出訊號 */}
        {data.map((d, idx) => 
          d.signal === '賣出' ? (
            <ReferenceDot
              key={`sell-${idx}`}
              x={d.date}
              y={d.close}
              r={6}
              fill="#ef4444"
              stroke="#dc2626"
              strokeWidth={2}
            />
          ) : null
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default CandlestickChart;
