import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  const [scanLimit, setScanLimit] = useState(50);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSignals, setSelectedSignals] = useState<string[]>([
    "攻擊K線",
    "多頭吞噬",
    "黑K吞噬",
    "內困型態",
  ]);

  const signalOptions = [
    { value: "攻擊K線", label: "攻擊K線" },
    { value: "多頭吞噬", label: "多頭吞噬" },
    { value: "黑K吞噬", label: "黑K吞噬" },
    { value: "內困型態", label: "內困型態" },
  ];

  const handleSignalToggle = (signal: string) => {
    setSelectedSignals((prev) =>
      prev.includes(signal)
        ? prev.filter((s) => s !== signal)
        : [...prev, signal]
    );
  };

  const handleSave = () => {
    // TODO: 保存設定到本地存儲或後端
    console.log({
      scanLimit,
      startDate,
      endDate,
      selectedSignals,
    });
    alert("設定已保存");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* 頁面標題 */}
        <div className="space-y-2">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              ← 返回儀表板
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">掃描參數設定</h1>
          <p className="text-slate-600">自訂全市場掃描的參數</p>
        </div>

        {/* 掃描數量設定 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">掃描股票數量</CardTitle>
            <CardDescription>設定每次掃描要檢查的股票數量上限</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scanLimit" className="text-slate-700 font-semibold">
                掃描數量上限（檔）
              </Label>
              <Input
                id="scanLimit"
                type="number"
                min="1"
                max="2000"
                value={scanLimit}
                onChange={(e) => setScanLimit(parseInt(e.target.value))}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-sm text-slate-600">
                建議值：50-100。數值越大，掃描時間越長，但覆蓋範圍越廣。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 日期範圍設定 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">歷史數據範圍</CardTitle>
            <CardDescription>設定用於技術分析的歷史數據時間範圍</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-slate-700 font-semibold">
                  開始日期
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-slate-700 font-semibold">
                  結束日期
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-sm text-slate-600">
              建議至少保留 120 天的歷史數據以計算季線（60MA）。
            </p>
          </CardContent>
        </Card>

        {/* 訊號過濾設定 */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg">技術訊號過濾</CardTitle>
            <CardDescription>選擇要在掃描結果中顯示的技術訊號類型</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {signalOptions.map((signal) => (
                <div key={signal.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={signal.value}
                    checked={selectedSignals.includes(signal.value)}
                    onCheckedChange={() => handleSignalToggle(signal.value)}
                  />
                  <Label
                    htmlFor={signal.value}
                    className="text-slate-700 font-medium cursor-pointer"
                  >
                    {signal.label}
                  </Label>
                </div>
              ))}
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                至少需要選擇一個訊號類型。未選擇的訊號將不會在掃描結果中顯示。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 操作按鈕 */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            保存設定
          </Button>
          <Link href="/">
            <Button variant="outline" className="flex-1 border-slate-300 hover:bg-slate-50">
              取消
            </Button>
          </Link>
        </div>

        {/* 說明區 */}
        <Card className="border-0 shadow-md bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">關於林家洋技術分析理論</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>
              <strong>攻擊K線：</strong>
              股價在一天內大幅上漲（通常超過3%），成交量明顯放大（超過5日均量1.5倍），表示主力表態看多。
            </p>
            <p>
              <strong>多頭吞噬：</strong>
              當日K線的開盤價低於前一日收盤價，但收盤價高於前一日開盤價，表示多方力量強勁，可能是轉強訊號。
            </p>
            <p>
              <strong>黑K吞噬：</strong>
              當日K線為黑K（下跌），且完全吞噬前一日的紅K（上漲），表示空方力量強勁，是反轉訊號。
            </p>
            <p>
              <strong>季線之上：</strong>
              股價位於60日均線（季線）之上，表示股票處於多頭趨勢中。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
