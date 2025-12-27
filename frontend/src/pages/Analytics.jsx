import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { IconSparkles, IconLoader2, IconRobot } from "@tabler/icons-react"
import { fetchAIAdvice } from "@/lib/api"
// [新增] 引入 Markdown 渲染組件
import ReactMarkdown from "react-markdown"

const getLast12Months = () => {
  const months = []
  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年 ${d.getMonth() + 1}月`
    months.push({ value, label })
  }
  return months
}

export default function Analytics() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [customPrompt, setCustomPrompt] = useState("")
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthOptions = getLast12Months()

  const handleAnalyze = async () => {
    setLoading(true)
    setResult(null)

    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const data = await fetchAIAdvice(
      startDate.toISOString(),
      endDate.toISOString(),
      customPrompt
    )

    setResult(data)
    setLoading(false)
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">智能財務分析 (AI Analytics)</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        
        {/* 左側控制面板 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>分析設定</CardTitle>
              <CardDescription>選擇時間與設定 AI 關注點</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label>選擇月份</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>自訂分析指令 (選填)</Label>
                <Textarea 
                  placeholder="例如：請特別分析我的伙食費支出是否過高，並給出省錢建議..."
                  className="h-32 resize-none"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  留空則使用系統預設的專業財務顧問提示詞。
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleAnalyze} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI 正在分析中...
                  </>
                ) : (
                  <>
                    <IconSparkles className="mr-2 h-4 w-4" />
                    開始分析
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右側結果顯示 */}
        <div className="space-y-6">
          {result ? (
            <Card className="h-full">
              <CardHeader className="border-b bg-muted/40">
                <div className="flex items-center gap-2">
                  <IconRobot className="h-5 w-5 text-primary" />
                  <CardTitle>分析報告</CardTitle>
                </div>
                <CardDescription>
                  {result.status === "success" 
                    ? "以下是根據您的財務數據生成的 AI 建議" 
                    : "分析過程中發生錯誤"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {result.status === "success" ? (
                  // [修改] 使用 ReactMarkdown 渲染內容
                  // prose: Tailwind Typography 插件，自動為 HTML 標籤加上漂亮的樣式
                  <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
                    <ReactMarkdown>
                        {result.advice}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-red-500 bg-red-50 p-4 rounded-md">
                    {result.message || "未知錯誤"}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // 空狀態
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <IconSparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">準備就緒</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                選擇月份並點擊「開始分析」，AI 將會讀取您的財務數據並提供專業建議。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}