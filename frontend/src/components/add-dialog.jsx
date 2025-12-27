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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import { createLog, createCategory, getCategories } from "@/lib/api"
import { Plus, AlertCircle } from "lucide-react"

export function AddDialog({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("log")
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null) 

  const [logData, setLogData] = useState({
    amount: "",
    category_name: "",
    note: "",
    actual_type: "Expenditure",
    date: new Date().toISOString().split('T')[0] 
  })

  const [catData, setCatData] = useState({
    name: "",
    default_type: "Expenditure"
  })

  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
      setError(null)
    }
  }, [open, activeTab]) 

  // [新增] 錯誤訊息解析 helper
  const parseErrorMessage = (err) => {
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail
      // 如果 Pydantic 回傳的是陣列 (Validation Error)
      if (Array.isArray(detail)) {
        return detail.map(d => d.msg).join(", ")
      }
      // 如果是物件或其他
      if (typeof detail === 'object') {
        return JSON.stringify(detail)
      }
      return String(detail)
    }
    return err.message || "發生未知錯誤"
  }

  const handleLogSubmit = async () => {
    if (!logData.amount || !logData.category_name) {
      setError("請填寫金額與類別")
      return
    }
    
    // 前端先擋下明顯錯誤，但後端也會擋
    if (parseFloat(logData.amount) <= 0) {
        setError("金額必須大於 0")
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
      setLogData({ ...logData, amount: "", note: "" }) 
      if (onSuccess) onSuccess()
    } catch (err) {
      // [修改] 使用 helper 處理錯誤訊息，避免白屏
      setError(parseErrorMessage(err))
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
        await createCategory(catData.name, catData.default_type)
        setOpen(false)
        setCatData({ name: "", default_type: "Expenditure" })
        if (onSuccess) onSuccess()
    } catch (err) {
        // [修改] 使用 helper 處理錯誤訊息，避免白屏
        setError(parseErrorMessage(err))
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
      
      <DialogContent className="sm:max-w-[425px] top-[10%] translate-y-0 sm:top-[20%] sm:translate-y-0">
        <DialogHeader>
          <DialogTitle>新增紀錄</DialogTitle>
          <DialogDescription className="sr-only">
            請在此填寫交易詳細資訊或新增類別
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="log">新增 Log (交易)</TabsTrigger>
            <TabsTrigger value="category">新增 Category (類別)</TabsTrigger>
          </TabsList>

          {/* ==================== Log 表單 ==================== */}
          <TabsContent value="log" className="space-y-4 pt-4">
            
            {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {/* 這裡現在安全了，因為 error 已經保證是字串 */}
                    <span>{error}</span>
                </div>
            )}

            <div className="grid gap-4">
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
                    <Input 
                        type="date" 
                        value={logData.date}
                        onChange={(e) => setLogData({...logData, date: e.target.value})}
                        className="block w-full"
                    />
                  </div>
               </div>

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