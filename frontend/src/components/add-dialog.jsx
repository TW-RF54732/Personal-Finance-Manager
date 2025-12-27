import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // 引用你剛做好的 Tabs
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // 假設你有 Alert 組件，若無可換成 div
import { createLog, createCategory, getCategories } from "@/lib/api" // 假設你有 createCategory
import { Plus, AlertCircle } from "lucide-react"

export function AddDialog({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("log")
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null) // 統一錯誤狀態管理

  // Log 表單狀態
  const [logData, setLogData] = useState({
    amount: "",
    category_name: "",
    note: "",
    actual_type: "Expenditure",
    date: new Date().toISOString().split('T')[0] // 預設今天
  })

  // Category 表單狀態
  const [catData, setCatData] = useState({
    name: "",
    default_type: "Expenditure"
  })

  // 開啟時載入類別 & 重置錯誤
  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
      setError(null)
    }
  }, [open, activeTab]) // 切換 Tab 時也清除錯誤，避免混淆

  const handleLogSubmit = async () => {
    if (!logData.amount || !logData.category_name) {
      setError("請填寫金額與類別")
      return
    }
    // 簡單驗證：支出金額若為負數提示 (視你邏輯而定)
    if (logData.actual_type === 'Expenditure' && parseFloat(logData.amount) < 0) {
        setError("金額不得小於 0。若為支出請選擇「支出」類型，數值請填寫正數。")
        return
    }

    setLoading(true)
    setError(null)
    try {
      await createLog({
        ...logData,
        amount: parseFloat(logData.amount)
      })
      setOpen(false)
      setLogData({ ...logData, amount: "", note: "" }) // 保留部分設定方便連續輸入
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCatSubmit = async () => {
    if (!catData.name) {
        setError("請輸入類別名稱")
        return
    }
    setLoading(true)
    setError(null)
    try {
        await createCategory(catData) // 假設有這支 API
        setOpen(false)
        setCatData({ name: "", default_type: "Expenditure" })
        if (onSuccess) onSuccess()
    } catch (err) {
        setError(err.response?.data?.detail || err.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-md">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新增資料</span>
          <span className="inline sm:hidden">新增</span>
        </Button>
      </DialogTrigger>
      
      {/* 讓 Dialog 內容向上對齊一點，避免鍵盤跳出時被遮擋 */}
      <DialogContent className="sm:max-w-[425px] top-[10%] translate-y-0 sm:top-[20%] sm:translate-y-0">
        <DialogHeader>
          <DialogTitle>新增紀錄</DialogTitle>
          <DialogDescription className="sr-only">
            請在此填寫交易詳細資訊或新增類別
          </DialogDescription>
        </DialogHeader>

        {/* [修改 2] Tab 等寬設定 
            w-full: 寬度滿版
            grid grid-cols-2: 強制兩欄等寬
        */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="log">新增 Log (交易)</TabsTrigger>
            <TabsTrigger value="category">新增 Category (類別)</TabsTrigger>
          </TabsList>

          {/* ==================== Log 表單 ==================== */}
          <TabsContent value="log" className="space-y-4 pt-4">
            
            {/* [修改 3] 錯誤訊息放在 TabsContent 內部最上方，防止 Tabs 漂移 */}
            {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid gap-4">
               {/* 第一列：類別、類型、日期 (三欄式) */}
               <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>類別</Label>
                    <Select 
                      value={logData.category_name} 
                      onValueChange={(val) => setLogData({...logData, category_name: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>類型</Label>
                    <Select 
                      value={logData.actual_type} 
                      onValueChange={(val) => setLogData({...logData, actual_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Expenditure">支出</SelectItem>
                        <SelectItem value="Income">收入</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>日期</Label>
                    {/* 這裡簡單用 input type="date"，也可以換成 DatePicker */}
                    <Input 
                        type="date" 
                        value={logData.date}
                        onChange={(e) => setLogData({...logData, date: e.target.value})}
                        className="block w-full"
                    />
                  </div>
               </div>

               {/* 第二列：金額 */}
               <div className="space-y-2">
                  <Label htmlFor="amount">金額</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={logData.amount}
                    onChange={(e) => setLogData({...logData, amount: e.target.value})}
                    placeholder="例如: 100"
                    className="text-lg font-medium"
                  />
               </div>

               {/* 第三列：備註 */}
               <div className="space-y-2">
                  <Label htmlFor="note">備註</Label>
                  <Input
                    id="note"
                    value={logData.note}
                    onChange={(e) => setLogData({...logData, note: e.target.value})}
                    placeholder="例如: 午餐"
                  />
               </div>
            </div>

            <div className="pt-2">
                <Button className="w-full" onClick={handleLogSubmit} disabled={loading}>
                  {loading ? "儲存中..." : "儲存 Log"}
                </Button>
            </div>
          </TabsContent>

          {/* ==================== Category 表單 ==================== */}
          <TabsContent value="category" className="space-y-4 pt-4">
             
            {/* 錯誤訊息同樣放在這裡 */}
            {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>類別名稱</Label>
                    <Input 
                        value={catData.name}
                        onChange={(e) => setCatData({...catData, name: e.target.value})}
                        placeholder="例如: 薪資、交通"
                    />
                </div>
                <div className="space-y-2">
                    <Label>預設類型</Label>
                    <Select 
                      value={catData.default_type} 
                      onValueChange={(val) => setCatData({...catData, default_type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Expenditure">支出 (Expenditure)</SelectItem>
                        <SelectItem value="Income">收入 (Income)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="pt-2">
                <Button className="w-full" onClick={handleCatSubmit} disabled={loading}>
                    {loading ? "儲存中..." : "儲存 Category"}
                </Button>
            </div>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}