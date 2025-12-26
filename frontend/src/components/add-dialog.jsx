import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert" // [新增] Alert 組件
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconPlus, IconLoader2, IconCalendar, IconClock, IconAlertCircle } from "@tabler/icons-react"
import { getCategories, createLog, createCategory } from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner" 

export function AddDialog({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null) // [新增] 錯誤訊息狀態

  // 表單狀態
  const [logForm, setLogForm] = useState({ 
    amount: "", 
    note: "", 
    category: "", 
    type: "Expenditure",
    date: new Date()
  })
  const [catForm, setCatForm] = useState({ name: "", type: "Expenditure" })

  useEffect(() => {
    if (open) {
      loadCategories()
      setLogForm(prev => ({ ...prev, date: new Date() }))
      setError(null) // 每次開啟重置錯誤
    }
  }, [open])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (e) {
      console.error("無法載入類別", e)
    }
  }

  // 類別連動收支類型
  useEffect(() => {
    if (logForm.category) {
      const selectedCat = categories.find(c => c.name === logForm.category)
      if (selectedCat) {
        setLogForm(prev => ({ ...prev, type: selectedCat.default_type }))
      }
    }
  }, [logForm.category, categories])

  const handleTimeChange = (e) => {
    const timeStr = e.target.value
    if (!timeStr) return
    const [hours, minutes] = timeStr.split(':').map(Number)
    const newDate = new Date(logForm.date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setLogForm({ ...logForm, date: newDate })
  }

  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) return
    const newDate = new Date(selectedDate)
    newDate.setHours(logForm.date.getHours())
    newDate.setMinutes(logForm.date.getMinutes())
    setLogForm({ ...logForm, date: newDate })
  }

  // [修改] 提交 Log 邏輯
  const handleLogSubmit = async () => {
    setError(null) // 清除舊錯誤

    // 1. 前端基本驗證
    if (!logForm.amount || !logForm.category) {
      setError("請填寫完整的金額與類別")
      return
    }

    const amountValue = parseFloat(logForm.amount)

    // 2. [新增] 驗證金額不得小於 0
    if (amountValue < 0) {
      setError("金額不得小於 0。若為支出請選擇「支出」類型，數值請填寫正數。")
      return
    }

    setLoading(true)
    try {
      await createLog({
        category_name: logForm.category,
        amount: amountValue,
        note: logForm.note,
        actual_type: logForm.type,
        timestamp: logForm.date.toISOString()
      })
      
      toast.success("交易紀錄新增成功！")
      setOpen(false)
      setLogForm({ ...logForm, amount: "", note: "", category: "" }) 
      if (onSuccess) onSuccess() 

    } catch (err) {
      // 3. [新增] 處理後端回傳的錯誤 (包含 422)
      console.error(err)
      let errorMsg = "發生未知錯誤"
      
      if (err.response) {
        // FastAPI 422 錯誤通常是 JSON array
        if (err.response.status === 422 && Array.isArray(err.response.data?.detail)) {
           // 將 422 的欄位錯誤組合成字串
           const details = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join(", ")
           errorMsg = `資料格式錯誤 (422): ${details}`
        } else {
           errorMsg = err.response.data?.detail || err.message
        }
      }
      
      setError(errorMsg) // 顯示紅色 Alert
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async () => {
    setError(null)
    if (!catForm.name) {
      setError("請填寫類別名稱")
      return
    }

    setLoading(true)
    try {
      await createCategory(catForm.name, catForm.type)
      toast.success("類別新增成功！")
      setOpen(false)
      setCatForm({ name: "", type: "Expenditure" })
      if (onSuccess) onSuccess()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hidden sm:flex gap-1">
          <IconPlus className="size-4" />
          新增資料
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增紀錄</DialogTitle>
          <DialogDescription>
            請選擇要新增的項目類型並填寫詳細資訊。
          </DialogDescription>
        </DialogHeader>

        {/* [新增] 錯誤訊息顯示區 - 紅框 */}
        {error && (
          <Alert variant="destructive" className="mb-2">
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="log" className="w-full" onValueChange={() => setError(null)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">新增 Log (交易)</TabsTrigger>
            <TabsTrigger value="category">新增 Category (類別)</TabsTrigger>
          </TabsList>
          
          {/* --- Log 表單 --- */}
          <TabsContent value="log" className="space-y-4 py-4">
            
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label>類別</Label>
                <Select 
                  value={logForm.category} 
                  onValueChange={(val) => setLogForm({...logForm, category: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇類別" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[110px] space-y-2">
                <Label>類型</Label>
                <Select 
                  value={logForm.type} 
                  onValueChange={(val) => setLogForm({...logForm, type: val})}
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

              <div className="w-[100px] space-y-2">
                <Label>日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal px-2",
                        !logForm.date && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {logForm.date ? format(logForm.date, "MM-dd") : <span>Pick</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 border-b border-border">
                        <Calendar
                          mode="single"
                          selected={logForm.date}
                          onSelect={handleDateSelect}
                          initialFocus
                        />
                    </div>
                    <div className="p-3 flex items-center gap-2">
                        <IconClock className="size-4 text-muted-foreground" />
                        <Input 
                            type="time" 
                            className="h-8"
                            value={format(logForm.date, "HH:mm")}
                            onChange={handleTimeChange}
                        />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid w-full items-center gap-2">
                <Label htmlFor="amount">金額</Label>
                {/* [修改] 加上 min="0" 限制，並移除允許負數的提示文字 */}
                <Input 
                  type="number" 
                  id="amount" 
                  min="0"
                  step="0.01"
                  placeholder="例如: 100" 
                  value={logForm.amount}
                  onChange={(e) => setLogForm({...logForm, amount: e.target.value})}
                />
            </div>
            
            <div className="grid w-full items-center gap-2">
                <Label htmlFor="note">備註</Label>
                <Input 
                  type="text" 
                  id="note" 
                  placeholder="例如: 午餐" 
                  value={logForm.note}
                  onChange={(e) => setLogForm({...logForm, note: e.target.value})}
                />
            </div>

            <div className="flex justify-end mt-4">
                <Button onClick={handleLogSubmit} disabled={loading}>
                  {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  儲存 Log
                </Button>
            </div>
          </TabsContent>
          
          {/* --- Category 表單 --- */}
          <TabsContent value="category" className="space-y-4 py-4">
             <div className="grid w-full items-center gap-2">
                <Label htmlFor="cat-name">類別名稱</Label>
                <Input 
                  type="text" 
                  id="cat-name" 
                  placeholder="例如: 薪資、交通" 
                  value={catForm.name}
                  onChange={(e) => setCatForm({...catForm, name: e.target.value})}
                />
            </div>
            
            <div className="grid w-full items-center gap-2">
              <Label>預設類型</Label>
              <Select 
                value={catForm.type} 
                onValueChange={(val) => setCatForm({...catForm, type: val})}
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

            <div className="flex justify-end mt-4">
                <Button onClick={handleCategorySubmit} disabled={loading}>
                  {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  儲存 Category
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}