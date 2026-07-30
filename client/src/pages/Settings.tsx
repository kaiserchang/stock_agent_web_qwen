import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2, Save } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ScanSettings {
  scanLimit: number;
  startDate: string;
  endDate: string;
  signalFilter: string[];
  stockList: string[];
}

const AVAILABLE_SIGNALS = [
  "攻擊K線",
  "多頭吞噬",
  "黑K吞噬",
  "內困型態",
];

export default function Settings() {
  const [settings, setSettings] = useState<ScanSettings>({
    scanLimit: 50,
    startDate: "",
    endDate: "",
    signalFilter: ["攻擊K線", "多頭吞噬", "黑K吞噬", "內困型態"],
    stockList: ["2330", "2454", "3008", "1590", "2357"],
  });

  const [newStock, setNewStock] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 獲取掃描設定
  const { data: scanSettings } = trpc.stock.getScanSettings.useQuery();

  // 更新掃描設定
  const updateSettingsMutation = trpc.stock.updateScanSettings.useMutation({
    onSuccess: () => {
      toast.success("設定已保存");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (scanSettings) {
      setSettings({
        scanLimit: scanSettings.scanLimit || 50,
        startDate: scanSettings.startDate || "",
        endDate: scanSettings.endDate || "",
        signalFilter: scanSettings.signalFilter || AVAILABLE_SIGNALS,
        stockList: settings.stockList,
      });
    }
  }, [scanSettings]);

  const handleScanLimitChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setSettings({ ...settings, scanLimit: num });
    }
  };

  const handleStartDateChange = (value: string) => {
    setSettings({ ...settings, startDate: value });
  };

  const handleEndDateChange = (value: string) => {
    setSettings({ ...settings, endDate: value });
  };

  const handleSignalToggle = (signal: string) => {
    setSettings({
      ...settings,
      signalFilter: settings.signalFilter.includes(signal)
        ? settings.signalFilter.filter((s) => s !== signal)
        : [...settings.signalFilter, signal],
    });
  };

  const handleAddStock = () => {
    if (newStock.trim() && !settings.stockList.includes(newStock.trim())) {
      setSettings({
        ...settings,
        stockList: [...settings.stockList, newStock.trim()],
      });
      setNewStock("");
      toast.success(`已添加股票 ${newStock.trim()}`);
    } else if (settings.stockList.includes(newStock.trim())) {
      toast.error("該股票已在清單中");
    }
  };

  const handleRemoveStock = (stock: string) => {
    setSettings({
      ...settings,
      stockList: settings.stockList.filter((s) => s !== stock),
    });
    toast.success(`已移除股票 ${stock}`);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        scanLimit: settings.scanLimit,
        startDate: settings.startDate,
        endDate: settings.endDate,
        signalFilter: settings.signalFilter,
        stockList: settings.stockList,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">推描設定</h1>
          <p className="text-slate-300">自定義股票清單、推描參數和訊號篩選</p>
        </div>

        {/* 警告信息 */}
        <Alert className="mb-6 border-cyan-600 bg-slate-800">
          <AlertCircle className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-cyan-300">
            在此頁面修改的設定將在下次推描時應用。所有更改會自動保存。
          </AlertDescription>
        </Alert>

        {/* 股票清單卡片 */}
        <Card className="mb-6 shadow-sm bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-amber-400">股票清單管理</CardTitle>
            <CardDescription className="text-slate-400">添加或移除要推描的股票代號</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 添加股票輸入框 */}
            <div className="flex gap-2">
              <Input
                placeholder="輸入股票代號 (例如: 2330)"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddStock();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddStock}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加
              </Button>
            </div>

            {/* 股票清單 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-300">
                目前清單 ({settings.stockList.length} 個)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {settings.stockList.length > 0 ? (
                  settings.stockList.map((stock) => (
                    <div
                      key={stock}
                      className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2"
                    >
                      <span className="font-semibold text-yellow-400">{stock}</span>
                      <button
                        onClick={() => handleRemoveStock(stock)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 col-span-full">未添加任何股票</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 掃描參數卡片 */}
        <Card className="mb-6 shadow-sm bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-amber-400">掃描參數</CardTitle>
            <CardDescription className="text-slate-400">設定掃描範圍和數量限制</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 掃描數量限制 */}
            <div className="space-y-2">
              <Label htmlFor="scanLimit" className="text-sm font-semibold text-slate-300">
                掃描數量上限
              </Label>
              <Input
                id="scanLimit"
                type="number"
                min="1"
                max="500"
                value={settings.scanLimit}
                onChange={(e) => handleScanLimitChange(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-slate-400">
                每次掃描最多検查的股票數量（1-500）
              </p>
            </div>

            {/* 日期範圍 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-semibold text-slate-300">
                  開始日期（可選）
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
                <p className="text-xs text-slate-400">
                  留空表示使用最近的數據
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-semibold text-slate-300">
                  結束日期（可選）
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={settings.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                />
                <p className="text-xs text-slate-400">
                  留空表示使用今天的日期
                </p>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* 訊號篩選卡片 */}
        <Card className="mb-6 shadow-sm bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-amber-400">訊號篩選</CardTitle>
            <CardDescription className="text-slate-400">選擇要検測的技術訊號類型</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {AVAILABLE_SIGNALS.map((signal) => (
                <div key={signal} className="flex items-center space-x-3">
                  <Checkbox
                    id={signal}
                    checked={settings.signalFilter.includes(signal)}
                    onCheckedChange={() => handleSignalToggle(signal)}
                  />
                  <Label
                    htmlFor={signal}
                    className="text-sm font-medium cursor-pointer flex-1 text-slate-300"
                  >
                    {signal}
                  </Label>
                  <span className="text-xs text-slate-400">
                    {signal === "攻擊K線" && "買進訊號"}
                    {signal === "多頭吞噬" && "買進訊號"}
                    {signal === "黑K吞噬" && "賣出訊號"}
                    {signal === "內困型態" && "中立訊號"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 保存按鈕 */}
        <div className="flex gap-3 justify-end">
          <Link href="/">
            <Button variant="outline">
              返回
            </Button>
          </Link>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存設定"}
          </Button>
        </div>
      </div>
    </div>
  );
}
