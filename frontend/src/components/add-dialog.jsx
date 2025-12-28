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
import { Plus, AlertCircle, Calendar as CalendarIcon, ChevronDown } from "lucide-react"

// Date Picker 相關
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function AddDialog({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("log")
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null) 

  // 日曆 Popover 開關狀態
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [logData, setLogData] = useState({
    amount: "",
    category_name: "",
    note: "",
    actual_type: "Expenditure",
    date: new Date() 
  })

  const [catData, setCatData] = useState({
    name: "",
    default_type: "Expenditure"
  })

  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
      setError(null)
      setLogData(prev => ({ ...prev, date: new Date() }))
    }
  }, [open, activeTab]) 

  const parseErrorMessage = (err) => {
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail
      if (Array.isArray(detail)) {
        return detail.map(d => d.msg).join(", ")
      }
      if (typeof detail === 'object') {
        return JSON.stringify(detail)
      }
      return String(detail)
    }
    return err.message || "發生未知錯誤"
  }

  // 處理日期變更 (保留原本的時間)
  const handleDateSelect = (newDate) => {
    if (!newDate) return
    const currentDate = logData.date || new Date()
    newDate.setHours(currentDate.getHours())
    newDate.setMinutes(currentDate.getMinutes())
    newDate.setSeconds(0)
    
    setLogData({ ...logData, date: newDate })
    setCalendarOpen(false) // 選完日期自動關閉
  }

  // 處理時間變更
  const handleTimeChange = (e) => {
    const timeStr = e.target.value // "14:30"
    if (!timeStr) return
    const [hours, minutes] = timeStr.split(':').map(Number)
    const newDate = new Date(logData.date || new Date())
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    newDate.setSeconds(0)
    setLogData({ ...logData, date: newDate })
  }

  const handleLogSubmit = async () => {
    if (!logData.amount || !logData.category_name) {
      setError("請填寫金額與類別")
      return
    }
    
    if (parseFloat(logData.amount) <= 0) {
        setError("金額必須大於 0")
        return
    }

    setLoading(true)
    setError(null)
    try {
      await createLog({
        category_name: logData.category_name,
        amount: parseFloat(logData.amount),
        actual_type: logData.actual_type,
        note: logData.note,
        timestamp: logData.date.toISOString() 
      })
      
      setOpen(false)
      setLogData({ 
        ...logData, 
        amount: "", 
        note: "",
        date: new Date() 
      }) 
      if (onSuccess) onSuccess()
    } catch (err) {
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
                    <span>{error}</span>
                </div>
            )}

            <div className="grid gap-4">
               {/* 第一列：類別、類型、金額 (這三項通常最重要) */}
               <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 col-span-1">
                    <Label>類別</Label>
                    <Select 
                      value={logData.category_name} 
                      onValueChange={(val) => {
                        const selectedCat = categories.find(c => c.name === val)
                        setLogData({
                          ...logData, 
                          category_name: val,
                          actual_type: selectedCat?.default_type || logData.actual_type
                        })
                      }}
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

                  <div className="space-y-2 col-span-1">
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

                  <div className="space-y-2 col-span-1">
                    <Label>金額</Label>
                    <Input
                        type="number"
                        value={logData.amount}
                        onChange={(e) => setLogData({...logData, amount: e.target.value})}
                        placeholder="100"
                    />
                  </div>
               </div>

               {/* [修改] 日期與時間 (拆分為左右兩欄) */}
               <div className="flex gap-4">
                  {/* 左側：日期選擇 (Calendar) */}
                  <div className="flex flex-col gap-2 flex-1">
                    <Label>日期</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between font-normal pl-3 pr-3",
                            !logData.date && "text-muted-foreground"
                          )}
                        >
                          <span className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {logData.date ? format(logData.date, "yyyy/MM/dd") : <span>選擇日期</span>}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={logData.date}
                          onSelect={handleDateSelect}
                          initialFocus
                          captionLayout="dropdown" // 允許下拉選年份
                          fromYear={2020}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* 右側：時間輸入 (Time Input) */}
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label>時間</Label>
                    <Input
                      type="time"
                      value={logData.date ? format(logData.date, "HH:mm") : "00:00"}
                      onChange={handleTimeChange}
                      className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden block w-full"
                    />
                  </div>
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

          {/* ==================== Category 表單 (保持不變) ==================== */}
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