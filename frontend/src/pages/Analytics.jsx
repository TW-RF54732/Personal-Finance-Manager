import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  IconSparkles, 
  IconLoader2, 
  IconRobot, 
  IconChartPie, 
  IconAlertTriangle, 
  IconActivity,
  IconChevronUp,
  IconChevronDown
} from "@tabler/icons-react"
import { fetchAIAdvice, fetchAnalysisReport } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// [新增] 引入動畫庫
import { motion, AnimatePresence } from "framer-motion"

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

// [新增] 動畫參數設定
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // 子元素依序延遲顯示
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function Analytics() {
  const [aiLoading, setAiLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_ai_result")
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  const [report, setReport] = useState(null)
  const [customPrompt, setCustomPrompt] = useState("")
  const [activeTab, setActiveTab] = useState("report")
  
  const [isMetricsOpen, setIsMetricsOpen] = useState(true)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthOptions = getLast12Months()

  useEffect(() => {
    if (result) {
      localStorage.setItem("finance_ai_result", JSON.stringify(result))
    }
  }, [result])

  useEffect(() => {
    const loadReportData = async () => {
        setReportLoading(true)
        setReport(null) 
        
        const [year, month] = selectedMonth.split('-').map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        try {
            const statsData = await fetchAnalysisReport(startDate.toISOString(), endDate.toISOString())
            if (statsData && statsData.status === "success") {
                setReport(statsData.data)
            }
        } catch (error) {
            console.error("Failed to load report", error)
        } finally {
            setReportLoading(false)
        }
    }

    loadReportData()
  }, [selectedMonth])

  const handleAIAnalyze = async () => {
    setAiLoading(true)
    setActiveTab("ai") // 自動切換到 AI Tab

    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    try {
      const aiData = await fetchAIAdvice(startDate.toISOString(), endDate.toISOString(), customPrompt)
      setResult(aiData)
      if (aiData?.status === "success") {
          toast.success("AI 分析完成")
      } else {
          toast.error("AI 分析失敗")
      }
    } catch (error) {
      console.error("AI Analysis failed", error)
      toast.error("連線錯誤")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">智能財務分析 (AI Analytics)</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        
        {/* 左側控制面板 (加入淡入動畫) */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
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
                onClick={handleAIAnalyze} 
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI 正在思考中...
                  </>
                ) : (
                  <>
                    <IconSparkles className="mr-2 h-4 w-4" />
                    {result ? "重新生成建議" : "生成 AI 建議"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* 右側結果顯示 */}
        <div className="space-y-6 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="report">
                  <IconChartPie className="mr-2 h-4 w-4" />
                  數據報告
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <IconRobot className="mr-2 h-4 w-4" />
                  AI 建議
                </TabsTrigger>
              </TabsList>

              {/* --- 數據報告 Tab --- */}
              <TabsContent value="report" className="space-y-4 mt-4 outline-none">
                <AnimatePresence mode="wait">
                    {reportLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[300px] text-muted-foreground"
                        >
                            <IconLoader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>正在讀取數據...</p>
                        </motion.div>
                    ) : report ? (
                      <motion.div 
                        key="content"
                        initial="hidden"
                        animate="show"
                        variants={containerVariants} // 套用交錯動畫
                        className="space-y-4"
                      >
                            <motion.div variants={itemVariants} className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-medium text-muted-foreground">核心指標概覽</h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 hover:bg-muted"
                                    onClick={() => setIsMetricsOpen(!isMetricsOpen)}
                                >
                                    {isMetricsOpen ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
                                </Button>
                            </motion.div>
                            
                            {/* [修改] 使用 AnimatePresence 處理折疊動畫 */}
                            <AnimatePresence initial={false}>
                                {isMetricsOpen && (
                                    <motion.div
                                        key="metrics"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                                            <Card>
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">總收入</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <div className="text-2xl font-bold text-primary truncate" title={report.metrics.total_income?.toLocaleString()}>
                                                        ${report.metrics.total_income?.toLocaleString()}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">總支出</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <div className="text-2xl font-bold text-primary truncate" title={report.metrics.total_expense?.toLocaleString()}>
                                                        ${report.metrics.total_expense?.toLocaleString()}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">淨儲蓄</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <div className="text-2xl font-bold text-primary truncate" title={report.metrics.net_savings?.toLocaleString()}>
                                                        ${report.metrics.net_savings?.toLocaleString()}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">儲蓄率</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <div className="text-2xl font-bold text-primary truncate">
                                                        {report.metrics.savings_rate}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid gap-4 md:grid-cols-2">
                                {/* 2. 支出結構 */}
                                <motion.div variants={itemVariants}>
                                    <Card className="h-full">
                                      <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                          <IconChartPie className="h-4 w-4 text-primary" />
                                          支出結構分析
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        {report.expenditure_structure.map((item, idx) => (
                                          <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                              <span className="font-medium">{item.category}</span>
                                              <span className="text-muted-foreground">${item.amount.toLocaleString()} ({item.percentage})</span>
                                            </div>
                                            <Progress value={parseFloat(item.percentage)} className="h-2" />
                                          </div>
                                        ))}
                                      </CardContent>
                                    </Card>
                                </motion.div>

                                {/* 3. 消費習慣 */}
                                <motion.div variants={itemVariants}>
                                    <Card className="h-full">
                                      <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                          <IconActivity className="h-4 w-4 text-primary" />
                                          消費習慣
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-6">
                                         <div>
                                            <p className="text-sm font-medium mb-2 text-muted-foreground">平均單筆消費金額</p>
                                            <div className="text-3xl font-bold text-primary">${report.consumption_behavior.average_transaction?.toLocaleString()}</div>
                                         </div>
                                         <div>
                                            <p className="text-sm font-medium mb-3 text-muted-foreground">高頻消費類別 (Top 3)</p>
                                            <div className="flex flex-wrap gap-2">
                                              {Object.entries(report.consumption_behavior.high_frequency_categories || {}).map(([cat, count]) => (
                                                <Badge key={cat} variant="outline" className="text-sm py-1 px-3">
                                                  {cat} <span className="ml-1 text-xs opacity-70">x{count}次</span>
                                                </Badge>
                                              ))}
                                            </div>
                                         </div>
                                      </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* 4. 異常交易 */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <IconAlertTriangle className="h-4 w-4 text-primary" />
                                        值得注意的交易
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                       <div className="space-y-2">
                                          {report.anomalies.length > 0 ? (
                                            report.anomalies.map((item, idx) => (
                                              <div key={idx} className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
                                                 <div className="grid gap-0.5 overflow-hidden">
                                                    <span className="font-medium text-sm truncate">{item.category}</span>
                                                    <span className="text-xs text-muted-foreground truncate" title={item.note}>{item.note}</span>
                                                 </div>
                                                 <div className="font-bold text-primary text-sm whitespace-nowrap ml-2">
                                                    ${item.amount.toLocaleString()}
                                                 </div>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-sm text-muted-foreground">本月無顯著異常交易。</p>
                                          )}
                                       </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-[300px] text-muted-foreground"
                      >
                        <p>尚無本月資料</p>
                      </motion.div>
                    )}
                </AnimatePresence>
              </TabsContent>

              {/* --- AI 建議 Tab --- */}
              <TabsContent value="ai" className="h-full mt-4 outline-none">
                <Card className="h-full">
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-2">
                      <IconRobot className="h-5 w-5 text-primary" />
                      <CardTitle>AI 財務顧問建議</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 relative min-h-[300px]">
                    
                    {/* [修改] AI Loading 遮罩動畫 */}
                    <AnimatePresence>
                        {aiLoading && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
                            >
                                <IconLoader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                <p className="text-sm text-muted-foreground font-medium animate-pulse">
                                    AI 正在分析最新的財務數據...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {result ? (
                       <motion.div 
                           // Loading 結束後，內容淡入
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: aiLoading ? 0.3 : 1, y: 0 }}
                           transition={{ duration: 0.5 }}
                       >
                           {result.status === "success" ? (
                            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
                                <ReactMarkdown>
                                    {result.advice}
                                </ReactMarkdown>
                            </div>
                           ) : (
                            <div className="text-red-500 p-4 rounded-md border border-red-200">
                                {result?.message || "無法取得 AI 建議。"}
                            </div>
                           )}
                       </motion.div>
                    ) : (
                        !aiLoading && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-[300px] text-muted-foreground"
                            >
                                <IconSparkles className="h-10 w-10 mb-4 text-muted-foreground/50" />
                                <p className="text-lg font-medium">AI 尚未啟動</p>
                                <p className="text-sm">點擊左側的「生成 AI 建議」按鈕來獲取專業分析。</p>
                            </motion.div>
                        )
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  )
}