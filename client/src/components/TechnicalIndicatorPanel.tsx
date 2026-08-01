import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface IndicatorData {
  date: string;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

interface TechnicalIndicatorPanelProps {
  data: IndicatorData[];
  showRSI?: boolean;
  showMACD?: boolean;
  showBB?: boolean;
}

export const TechnicalIndicatorPanel: React.FC<TechnicalIndicatorPanelProps> = ({
  data,
  showRSI = false,
  showMACD = false,
  showBB = false,
}) => {
  // RSI 面板
  if (showRSI) {
    return (
      <div className="w-full h-64 bg-slate-800 rounded-lg border border-slate-600 p-4">
        <h3 className="text-sm font-semibold text-cyan-300 mb-3">RSI（相對強度指數）</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#cbd5e1' }}
              interval={Math.max(0, Math.floor(data.length / 10))}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#cbd5e1' }}
              domain={[0, 100]}
              label={{ value: "RSI", angle: -90, position: "insideLeft", fill: '#cbd5e1' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend />
            
            {/* RSI 線 */}
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#06b6d4"
              dot={false}
              strokeWidth={2}
              name="RSI"
            />
            
            {/* 超買線 (70) */}
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "超買 (70)", position: "right", fill: '#ef4444' }} />
            
            {/* 超賣線 (30) */}
            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "超賣 (30)", position: "right", fill: '#22c55e' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // MACD 面板
  if (showMACD) {
    return (
      <div className="w-full h-64 bg-slate-800 rounded-lg border border-slate-600 p-4">
        <h3 className="text-sm font-semibold text-cyan-300 mb-3">MACD（指數平滑異同移動平均線）</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#cbd5e1' }}
              interval={Math.max(0, Math.floor(data.length / 10))}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#cbd5e1' }}
              label={{ value: "MACD", angle: -90, position: "insideLeft", fill: '#cbd5e1' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend />
            
            {/* MACD 線 */}
            <Line
              type="monotone"
              dataKey="macd"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
              name="MACD"
            />
            
            {/* 信號線 */}
            <Line
              type="monotone"
              dataKey="macdSignal"
              stroke="#f87171"
              dot={false}
              strokeWidth={2}
              name="信號線"
            />
            
            {/* 零線 */}
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="5 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 布林帶面板
  if (showBB) {
    return (
      <div className="w-full h-64 bg-slate-800 rounded-lg border border-slate-600 p-4">
        <h3 className="text-sm font-semibold text-cyan-300 mb-3">布林帶（Bollinger Bands）</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#cbd5e1' }}
              interval={Math.max(0, Math.floor(data.length / 10))}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#cbd5e1' }}
              label={{ value: "價格", angle: -90, position: "insideLeft", fill: '#cbd5e1' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Legend />
            
            {/* 上布林帶 */}
            <Line
              type="monotone"
              dataKey="bbUpper"
              stroke="#ef4444"
              dot={false}
              strokeWidth={1}
              name="上布林帶"
            />
            
            {/* 中布林帶 */}
            <Line
              type="monotone"
              dataKey="bbMiddle"
              stroke="#fbbf24"
              dot={false}
              strokeWidth={2}
              name="中布林帶"
            />
            
            {/* 下布林帶 */}
            <Line
              type="monotone"
              dataKey="bbLower"
              stroke="#22c55e"
              dot={false}
              strokeWidth={1}
              name="下布林帶"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};

export default TechnicalIndicatorPanel;
