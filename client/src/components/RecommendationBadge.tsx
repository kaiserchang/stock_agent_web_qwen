import React from "react";

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

    if (score >= 90) {
      label = "強烈買進";
      bgColor = "bg-green-700";
      textColor = "text-white";
      stars = "⭐⭐⭐⭐⭐";
    } else if (score >= 75) {
      label = "建議買進";
      bgColor = "bg-green-500";
      textColor = "text-white";
      stars = "⭐⭐⭐⭐";
    } else if (score >= 60) {
      label = "中度買進";
      bgColor = "bg-green-400";
      textColor = "text-gray-900";
      stars = "⭐⭐⭐";
    } else if (score >= 45) {
      label = "溫和買進";
      bgColor = "bg-green-300";
      textColor = "text-gray-900";
      stars = "⭐⭐";
    } else {
      label = "輕度買進";
      bgColor = "bg-green-200";
      textColor = "text-gray-900";
      stars = "⭐";
    }

    return (
      <div className="flex flex-col gap-1">
        <div className={`${bgColor} ${textColor} px-3 py-1 rounded-md text-sm font-semibold text-center`}>
          {score}
        </div>
        <div className={`${bgColor} ${textColor} px-3 py-1 rounded-md text-xs text-center`}>
          {label}
        </div>
        <div className="text-center text-sm">
          {stars}
        </div>
      </div>
    );
  }

  // 賣出訊號（負分）
  if (score < 0) {
    let label = "";
    let bgColor = "";
    let textColor = "";
    let bombs = "";

    if (score <= -120) {
      label = "緊急脫手";
      bgColor = "bg-red-700";
      textColor = "text-white";
      bombs = "💣💣💣💣💣";
    } else if (score <= -90) {
      label = "強烈脫手";
      bgColor = "bg-red-600";
      textColor = "text-white";
      bombs = "💣💣💣💣";
    } else if (score <= -60) {
      label = "建議脫手";
      bgColor = "bg-orange-500";
      textColor = "text-white";
      bombs = "💣💣💣";
    } else {
      label = "注意風險";
      bgColor = "bg-yellow-500";
      textColor = "text-gray-900";
      bombs = "💣💣";
    }

    return (
      <div className="flex flex-col gap-1">
        <div className={`${bgColor} ${textColor} px-3 py-1 rounded-md text-sm font-semibold text-center`}>
          {score}
        </div>
        <div className={`${bgColor} ${textColor} px-3 py-1 rounded-md text-xs text-center`}>
          {label}
        </div>
        <div className="text-center text-lg">
          {bombs}
        </div>
      </div>
    );
  }

  // 中立訊號（0 分）
  return (
    <div className="flex flex-col gap-1">
      <div className="bg-gray-300 text-gray-900 px-3 py-1 rounded-md text-sm font-semibold text-center">
        0
      </div>
      <div className="bg-gray-300 text-gray-900 px-3 py-1 rounded-md text-xs text-center">
        觀望
      </div>
      <div className="text-center text-sm text-gray-500">
        -
      </div>
    </div>
  );
};
