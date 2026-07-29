import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RecommendationBadgeProps {
  score: number; // -120 到 +120
  signalType: string;
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  score,
  signalType,
}) => {
  // 買進訊號（正分）
  if (score > 0) {
    let label = "";
    let bgColor = "";
    let textColor = "";
    let stars = "";
    let tooltipText = "";

    if (score >= 90) {
      label = "強烈買進";
      bgColor = "hsl(45, 100%, 35%)";
      textColor = "#e8d9b8";
      stars = "⭐⭐⭐⭐⭐";
      tooltipText = `強烈買進訊號 (${score}分)\n${signalType}\n建議立即進場`;
    } else if (score >= 75) {
      label = "建議買進";
      bgColor = "hsl(45, 100%, 45%)";
      textColor = "#e8d9b8";
      stars = "⭐⭐⭐⭐";
      tooltipText = `建議買進訊號 (${score}分)\n${signalType}\n可考慮進場`;
    } else if (score >= 60) {
      label = "中度買進";
      bgColor = "hsl(45, 100%, 55%)";
      textColor = "#e8d9b8";
      stars = "⭐⭐⭐";
      tooltipText = `中度買進訊號 (${score}分)\n${signalType}\n觀望後進場`;
    } else if (score >= 45) {
      label = "溫和買進";
      bgColor = "hsl(45, 100%, 65%)";
      textColor = "#e8d9b8";
      stars = "⭐⭐";
      tooltipText = `溫和買進訊號 (${score}分)\n${signalType}\n謹慎進場`;
    } else {
      label = "輕度買進";
      bgColor = "hsl(45, 100%, 75%)";
      textColor = "#e8d9b8";
      stars = "⭐";
      tooltipText = `輕度買進訊號 (${score}分)\n${signalType}\n持續觀察`;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-1 cursor-help">
              <div style={{ backgroundColor: bgColor, color: textColor }} className="px-3 py-1 rounded-md text-sm font-semibold text-center">
                {score}
              </div>
              <div style={{ backgroundColor: bgColor, color: textColor }} className="px-3 py-1 rounded-md text-xs text-center">
                {label}
              </div>
              <div className="text-center text-sm">
                {stars}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="whitespace-pre-wrap text-sm">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 賣出訊號（負分）
  if (score < 0) {
    let label = "";
    let bgColor = "";
    let textColor = "";
    let bombs = "";
    let tooltipText = "";

    if (score <= -120) {
      label = "緊急脫手";
      bgColor = "hsl(0, 100%, 45%)";
      textColor = "#e8d9b8";
      bombs = "💣💣💣💣💣";
      tooltipText = `緊急脫手警告 (${score}分)\n${signalType}\n⚠️ 立即減持或止損`;
    } else if (score <= -90) {
      label = "強烈脫手";
      bgColor = "hsl(0, 100%, 55%)";
      textColor = "#e8d9b8";
      bombs = "💣💣💣💣";
      tooltipText = `強烈脫手警告 (${score}分)\n${signalType}\n⚠️ 建議減持`;
    } else if (score <= -60) {
      label = "建議脫手";
      bgColor = "hsl(30, 100%, 50%)";
      textColor = "#e8d9b8";
      bombs = "💣💣💣";
      tooltipText = `脫手建議 (${score}分)\n${signalType}\n⚠️ 考慮減持`;
    } else {
      label = "注意風險";
      bgColor = "hsl(200, 100%, 45%)";
      textColor = "#e8d9b8";
      bombs = "💣💣";
      tooltipText = `風險提示 (${score}分)\n${signalType}\n⚠️ 注意風險變化`;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-1 cursor-help">
              <div style={{ backgroundColor: bgColor, color: textColor }} className="px-3 py-1 rounded-md text-sm font-semibold text-center">
                {score}
              </div>
              <div style={{ backgroundColor: bgColor, color: textColor }} className="px-3 py-1 rounded-md text-xs text-center">
                {label}
              </div>
              <div className="text-center text-lg">
                {bombs}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="whitespace-pre-wrap text-sm">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 中立訊號（0 分）
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1 cursor-help">
            <div style={{ backgroundColor: "hsl(200, 20%, 50%)", color: "#ffffff" }} className="px-3 py-1 rounded-md text-sm font-semibold text-center">
              0
            </div>
            <div style={{ backgroundColor: "hsl(200, 20%, 50%)", color: "#ffffff" }} className="px-3 py-1 rounded-md text-xs text-center">
              觀望
            </div>
            <div className="text-center text-sm" style={{ color: "hsl(200, 20%, 60%)" }}>
              -
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">無明確訊號\n{signalType}\n繼續觀察市場動向</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
