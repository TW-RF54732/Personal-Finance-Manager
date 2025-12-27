import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { fetchSystemSettings, updateSystemSettings, fetchGoalSettings, updateGoalSettings } from "@/lib/api"
import { toast } from "sonner"
import { IconDeviceFloppy, IconLoader2, IconTargetArrow, IconSettings } from "@tabler/icons-react"

export default function Settings() {
  const [loading, setLoading] = useState(false)
  
  // 系統設定狀態
  const [systemConfig, setSystemConfig] = useState({
    sql_url: "",
    LLM_model_path: "",
    default_system_prompt: "",
    temperature: 0.2,
    max_tokens: 2048,
    n_ctx: 4096,
    n_threads: 8
  })

  // 目標設定狀態
  const [goalConfig, setGoalConfig] = useState({
    income: 0,
    expenditure: 0,
    total_save: 0
  })

  // 載入初始資料
  useEffect(() => {
    const loadData = async () => {
      const [sysRes, goalRes] = await Promise.all([
        fetchSystemSettings(),
        fetchGoalSettings()
      ])
      if (sysRes) setSystemConfig(sysRes)
      if (goalRes) setGoalConfig(goalRes)
    }
    loadData()
  }, [])

  // 儲存系統設定
  const handleSystemSave = async () => {
    setLoading(true)
    try {
      await updateSystemSettings(systemConfig)
      toast.success("系統設定已更新")
    } catch (e) {
      toast.error("更新失敗: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  // 儲存目標設定
  const handleGoalSave = async () => {
    setLoading(true)
    try {
      await updateGoalSettings({
        income: parseFloat(goalConfig.income),
        expenditure: parseFloat(goalConfig.expenditure),
        total_save: parseFloat(goalConfig.total_save)
      })
      toast.success("財務目標已更新")
    } catch (e) {
      toast.error("更新失敗: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">系統設定 (Settings)</h2>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals">財務目標 (Financial Goals)</TabsTrigger>
          <TabsTrigger value="system">系統參數 (System Config)</TabsTrigger>
        </TabsList>

        {/* --- 財務目標 Tab --- */}
        <TabsContent value="goals" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconTargetArrow className="h-5 w-5 text-primary" />
                <CardTitle>每月目標設定</CardTitle>
              </div>
              <CardDescription>
                設定您的每月預期收入、支出上限與儲蓄目標，這些數值將用於 Dashboard 的達成率計算。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="goal-income">預期月收入 (Target Income)</Label>
                <Input 
                  id="goal-income" 
                  type="number" 
                  value={goalConfig.income}
                  onChange={(e) => setGoalConfig({...goalConfig, income: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="goal-expense">預期月支出 (Target Expense)</Label>
                <Input 
                  id="goal-expense" 
                  type="number" 
                  value={goalConfig.expenditure}
                  onChange={(e) => setGoalConfig({...goalConfig, expenditure: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="goal-save">預期月儲蓄 (Target Savings)</Label>
                <Input 
                  id="goal-save" 
                  type="number" 
                  value={goalConfig.total_save}
                  onChange={(e) => setGoalConfig({...goalConfig, total_save: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleGoalSave} disabled={loading} className="ml-auto">
                {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                <IconDeviceFloppy className="mr-2 h-4 w-4" />
                儲存目標
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- 系統參數 Tab --- */}
        <TabsContent value="system" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconSettings className="h-5 w-5 text-primary" />
                <CardTitle>進階系統參數</CardTitle>
              </div>
              <CardDescription>
                設定資料庫連線字串與 AI 模型的運行參數。請謹慎修改。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* 資料庫設定 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">資料庫 (Database)</h3>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="sql-url">資料庫連線字串 (SQL URL)</Label>
                  <Input 
                    id="sql-url" 
                    value={systemConfig.sql_url || ""}
                    onChange={(e) => setSystemConfig({...systemConfig, sql_url: e.target.value})}
                    placeholder="sqlite:///./finance.db"
                  />
                </div>
              </div>

              {/* AI 模型設定 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">AI 模型 (LLM)</h3>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="model-path">模型路徑 (Model Path)</Label>
                  <Input 
                    id="model-path" 
                    value={systemConfig.LLM_model_path || ""}
                    onChange={(e) => setSystemConfig({...systemConfig, LLM_model_path: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="temp">溫度 (Temperature)</Label>
                    <Input 
                      id="temp" type="number" step="0.1"
                      value={systemConfig.temperature || 0}
                      onChange={(e) => setSystemConfig({...systemConfig, temperature: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="threads">執行緒 (Threads)</Label>
                    <Input 
                      id="threads" type="number"
                      value={systemConfig.n_threads || 0}
                      onChange={(e) => setSystemConfig({...systemConfig, n_threads: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="prompt">預設系統提示詞 (Default System Prompt)</Label>
                  <Textarea 
                    id="prompt" 
                    className="h-32 font-mono text-xs"
                    value={systemConfig.default_system_prompt || ""}
                    onChange={(e) => setSystemConfig({...systemConfig, default_system_prompt: e.target.value})}
                  />
                </div>
              </div>

            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSystemSave} disabled={loading} className="ml-auto">
                {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                <IconDeviceFloppy className="mr-2 h-4 w-4" />
                儲存設定
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}