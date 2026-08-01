import React, { useMemo } from 'react';

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleStickRendererProps {
  data: CandleData[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

/**
 * 自訂蠟燭圖渲染器
 * 使用 SVG 繪製真正的 OHLC 蠟燭圖
 * 紅色表示上漲（收盤 > 開盤），綠色表示下跌（收盤 < 開盤）
 */
export const CandleStickRenderer: React.FC<CandleStickRendererProps> = ({
  data,
  width,
  height,
  margin = { top: 20, right: 30, bottom: 60, left: 60 },
}) => {
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const scales = useMemo(() => {
    if (data.length === 0) {
      return { xScale: 0, yScale: 0, minPrice: 0, maxPrice: 0 };
    }

    // 計算價格範圍
    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // 計算縮放比例
    const xScale = chartWidth / (data.length - 1 || 1);
    const yScale = chartHeight / (priceRange || 1);

    return { xScale, yScale, minPrice, maxPrice };
  }, [data, chartWidth, chartHeight]);

  const candleWidth = Math.max(2, Math.min(10, scales.xScale * 0.6));

  const renderCandle = (candle: CandleData, index: number) => {
    const x = margin.left + index * scales.xScale;
    const isUp = candle.close >= candle.open;
    const bodyColor = isUp ? '#ef4444' : '#22c55e'; // 紅漲綠跌
    const wickColor = isUp ? '#ef4444' : '#22c55e';

    // 計算 Y 座標（從下往上）
    const yHigh = margin.top + chartHeight - (candle.high - scales.minPrice) * scales.yScale;
    const yLow = margin.top + chartHeight - (candle.low - scales.minPrice) * scales.yScale;
    const yOpen = margin.top + chartHeight - (candle.open - scales.minPrice) * scales.yScale;
    const yClose = margin.top + chartHeight - (candle.close - scales.minPrice) * scales.yScale;

    const bodyTop = Math.min(yOpen, yClose);
    const bodyHeight = Math.abs(yClose - yOpen) || 1;

    return (
      <g key={`candle-${index}`}>
        {/* 上下影線 */}
        <line
          x1={x}
          y1={yHigh}
          x2={x}
          y2={yLow}
          stroke={wickColor}
          strokeWidth={1}
        />

        {/* 實體 */}
        <rect
          x={x - candleWidth / 2}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={bodyColor}
          stroke={bodyColor}
          strokeWidth={0.5}
        />
      </g>
    );
  };

  // 計算 X 軸標籤
  const xAxisLabels = useMemo(() => {
    const labels = [];
    const step = Math.max(1, Math.floor(data.length / 10));
    for (let i = 0; i < data.length; i += step) {
      labels.push(i);
    }
    if (labels[labels.length - 1] !== data.length - 1) {
      labels.push(data.length - 1);
    }
    return labels;
  }, [data.length]);

  // 計算 Y 軸標籤
  const yAxisLabels = useMemo(() => {
    const labels = [];
    const step = (scales.maxPrice - scales.minPrice) / 5;
    for (let i = 0; i <= 5; i++) {
      labels.push(scales.minPrice + step * i);
    }
    return labels;
  }, [scales.minPrice, scales.maxPrice]);

  return (
    <svg width={width} height={height} className="bg-slate-900">
      {/* 背景網格 */}
      <defs>
        <pattern id="grid" width={scales.xScale} height="40" patternUnits="userSpaceOnUse">
          <path d={`M ${scales.xScale} 0 L 0 0 0 40`} fill="none" stroke="#475569" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid)" />

      {/* Y 軸 */}
      <line
        x1={margin.left}
        y1={margin.top}
        x2={margin.left}
        y2={margin.top + chartHeight}
        stroke="#cbd5e1"
        strokeWidth={1}
      />

      {/* X 軸 */}
      <line
        x1={margin.left}
        y1={margin.top + chartHeight}
        x2={margin.left + chartWidth}
        y2={margin.top + chartHeight}
        stroke="#cbd5e1"
        strokeWidth={1}
      />

      {/* Y 軸標籤 */}
      {yAxisLabels.map((price, i) => {
        const y = margin.top + chartHeight - (price - scales.minPrice) * scales.yScale;
        return (
          <g key={`y-label-${i}`}>
            <line x1={margin.left - 5} y1={y} x2={margin.left} y2={y} stroke="#cbd5e1" strokeWidth={1} />
            <text
              x={margin.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#cbd5e1"
            >
              {price.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* X 軸標籤 */}
      {xAxisLabels.map((idx) => {
        const x = margin.left + idx * scales.xScale;
        return (
          <g key={`x-label-${idx}`}>
            <line x1={x} y1={margin.top + chartHeight} x2={x} y2={margin.top + chartHeight + 5} stroke="#cbd5e1" strokeWidth={1} />
            <text
              x={x}
              y={margin.top + chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#cbd5e1"
              transform={`rotate(45 ${x} ${margin.top + chartHeight + 20})`}
            >
              {data[idx]?.date || ''}
            </text>
          </g>
        );
      })}

      {/* 蠟燭圖 */}
      <g>
        {data.map((candle, index) => renderCandle(candle, index))}
      </g>

      {/* Y 軸標籤文字 */}
      <text
        x={-chartHeight / 2}
        y={15}
        textAnchor="middle"
        fontSize="12"
        fill="#cbd5e1"
        transform="rotate(-90)"
      >
        股價 (NT$)
      </text>

      {/* X 軸標籤文字 */}
      <text
        x={margin.left + chartWidth / 2}
        y={height - 5}
        textAnchor="middle"
        fontSize="12"
        fill="#cbd5e1"
      >
        日期
      </text>
    </svg>
  );
};

export default CandleStickRenderer;
