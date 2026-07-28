import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, AlertTriangle, Layers } from "lucide-react";

interface SignalExplanationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SignalExplanation({ open, onOpenChange }: SignalExplanationProps) {
  const signals = [
    {
      id: "attack-k",
      name: "攻擊K線",
      icon: Zap,
      emoji: "⚡",
      color: "text-red-500",
      bgColor: "bg-red-50",
      strength: "最強買入信號",
      definition: "股價在成交量放大的情況下，出現明顯上漲的紅K線。代表多方力量的強勢表現。",
      conditions: [
        "漲幅 ≥ 3%",
        "必須是紅K線（收盤價 > 開盤價）",
        "成交量 > 5日平均成交量 × 1.5倍"
      ],
      meaning: [
        "✅ 強烈買入信號",
        "✅ 適合進場",
        "✅ 風險較低"
      ],
      suggestion: "結合季線位置判斷，季線之上更安全。設置止損點在前一個低點下方。"
    },
    {
      id: "bullish-engulfing",
      name: "多頭吞噬",
      icon: TrendingUp,
      emoji: "📈",
      color: "text-green-500",
      bgColor: "bg-green-50",
      strength: "反轉買入信號",
      definition: "當前紅K線的實體完全包覆前一根黑K線的實體。代表多方力量的轉折。",
      conditions: [
        "前一根是黑K線（收盤價 < 開盤價）",
        "當前是紅K線（收盤價 > 開盤價）",
        "紅K完全包覆黑K的實體"
      ],
      meaning: [
        "✅ 反轉買入信號",
        "✅ 轉折點",
        "✅ 中等強度信號"
      ],
      suggestion: "常出現在下跌後的底部。結合技術面支撐位效果更佳。適合中期投資者進場。"
    },
    {
      id: "bearish-engulfing",
      name: "黑K吞噬",
      icon: AlertTriangle,
      emoji: "⚠️",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      strength: "賣出警示信號",
      definition: "當前黑K線的實體完全包覆前一根紅K線的實體。代表空方力量的轉折。",
      conditions: [
        "前一根是紅K線（收盤價 > 開盤價）",
        "當前是黑K線（收盤價 < 開盤價）",
        "黑K完全包覆紅K的實體"
      ],
      meaning: [
        "❌ 賣出警示信號",
        "❌ 風險信號",
        "❌ 謹慎持股"
      ],
      suggestion: "出現時應考慮獲利了結。如已持股應設置止損。不適合新進場買入。"
    },
    {
      id: "harami",
      name: "內困型態",
      icon: Layers,
      emoji: "📦",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      strength: "整理信號",
      definition: "前一根大K線的實體內部出現一根小K線。代表市場力量的衰退和整理。",
      conditions: [
        "前一根是大K線（實體較大）",
        "當前是小K線（實體較小）",
        "小K線完全被包含在大K線的價格範圍內"
      ],
      meaning: [
        "⏸️ 整理信號",
        "⏸️ 反轉預兆",
        "⏸️ 中等強度信號"
      ],
      suggestion: "出現後等待下一根K線確認方向。可作為加倉或減倉的參考。不應作為單獨交易信號。"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">技術訊號詳細講解</DialogTitle>
          <DialogDescription>
            基於林家洋老師的技術分析理論，了解四大技術訊號的含義和應用
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="attack-k" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {signals.map((signal) => (
              <TabsTrigger key={signal.id} value={signal.id} className="text-xs md:text-sm">
                <span className="hidden sm:inline">{signal.emoji} {signal.name}</span>
                <span className="sm:hidden">{signal.emoji}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {signals.map((signal) => (
            <TabsContent key={signal.id} value={signal.id} className="space-y-4">
              <Card className={signal.bgColor}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{signal.emoji}</span>
                    <div>
                      <CardTitle className={signal.color}>{signal.name}</CardTitle>
                      <CardDescription>{signal.strength}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 定義 */}
                  <div>
                    <h4 className="font-semibold mb-2">📌 定義</h4>
                    <p className="text-sm text-slate-700">{signal.definition}</p>
                  </div>

                  {/* 識別條件 */}
                  <div>
                    <h4 className="font-semibold mb-2">🔍 識別條件</h4>
                    <ul className="space-y-1 text-sm">
                      {signal.conditions.map((condition, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-slate-700">{condition}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 投資意義 */}
                  <div>
                    <h4 className="font-semibold mb-2">💡 投資意義</h4>
                    <div className="flex flex-wrap gap-2">
                      {signal.meaning.map((meaning, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {meaning}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 實戰建議 */}
                  <div className="bg-white/50 p-3 rounded-lg border border-slate-200">
                    <h4 className="font-semibold mb-2 text-sm">💼 實戰建議</h4>
                    <p className="text-sm text-slate-700">{signal.suggestion}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* 季線說明 */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">📊 季線位置判斷</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-700 mb-2">✅ 股價在季線之上</h5>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>• 代表股票處於上升趨勢</li>
                  <li>• 風險較低，更適合買入</li>
                  <li>• 多空分界明確</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <h5 className="font-semibold text-orange-700 mb-2">⚠️ 股價在季線之下</h5>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>• 代表股票處於下跌趨勢</li>
                  <li>• 即使有買入訊號也應謹慎</li>
                  <li>• 建議等待股價回到季線之上</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 風險提示 */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-700">⚠️ 風險提示</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-slate-700">
              <li>• <strong>技術訊號不是必然</strong> - 歷史訊號不保證未來表現</li>
              <li>• <strong>需要資金管理</strong> - 建議單筆投資不超過總資金的 5%</li>
              <li>• <strong>結合基本面</strong> - 不應只依賴技術面</li>
              <li>• <strong>設置止損</strong> - 任何投資都應有明確的風險控制</li>
            </ul>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
