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
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconPlus, IconLoader2, IconCalendar, IconClock } from "@tabler/icons-react"
import { getCategories, createLog, createCategory } from "@/lib/api"
import { format } from "date-fns" // 用來格式化日期
import { cn } from "@/lib/utils"
// 假設你有安裝 sonner，若無可用 alert 代替
import { toast } from "sonner" 

export function AddDialog({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])

  // 表單狀態
  const [logForm, setLogForm] = useState({ 
    amount: "", 
    note: "", 
    category: "", 
    type: "Expenditure", // 預設支出
    date: new Date()     // 預設當下時間
  })
  const [catForm, setCatForm] = useState({ name: "", type: "Expenditure" })

  // 開啟彈窗時抓取類別列表
  useEffect(() => {
    if (open) {
      loadCategories()
      // 每次開啟重置時間為當下
      setLogForm(prev => ({ ...prev, date: new Date() }))
    }
  }, [open])

  const loadCategories = async () => {
    const data = await getCategories()
    setCategories(data)
  }

  // [關鍵邏輯] 當類別改變時，自動切換收支類型為該類別的預設值
  useEffect(() => {
    if (logForm.category) {
      const selectedCat = categories.find(c => c.name === logForm.category)
      if (selectedCat) {
        setLogForm(prev => ({ ...prev, type: selectedCat.default_type }))
      }
    }
  }, [logForm.category, categories])

  // 處理時間選擇 (Input type="time")
  const handleTimeChange = (e) => {
    const timeStr = e.target.value
    if (!timeStr) return
    const [hours, minutes] = timeStr.split(':').map(Number)
    const newDate = new Date(logForm.date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setLogForm({ ...logForm, date: newDate })
  }

  // 處理日期選擇 (Calendar)
  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) return
    const newDate = new Date(selectedDate)
    // 保留原本的時間
    newDate.setHours(logForm.date.getHours())
    newDate.setMinutes(logForm.date.getMinutes())
    setLogForm({ ...logForm, date: newDate })
  }

  // 提交 Log
  const handleLogSubmit = async () => {
    if (!logForm.amount || !logForm.category) {
      toast.error("請填寫金額與類別")
      return
    }
    
    setLoading(true)
    try {
      await createLog({
        category_name: logForm.category,
        amount: parseFloat(logForm.amount),
        note: logForm.note,
        actual_type: logForm.type, // 傳送選擇的類型
        timestamp: logForm.date.toISOString() // 傳送完整的日期時間
      })
      toast.success("交易紀錄新增成功！")
      setOpen(false)
      // 重置表單 (日期除外，下次開會重置)
      setLogForm({ ...logForm, amount: "", note: "", category: "" }) 
      if (onSuccess) onSuccess() 
    } catch (error) {
      toast.error("新增失敗: " + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 提交 Category
  const handleCategorySubmit = async () => {
    if (!catForm.name) {
      toast.error("請填寫類別名稱")
      return
    }

    setLoading(true)
    try {
      await createCategory(catForm.name, catForm.type)
      toast.success("類別新增成功！")
      setOpen(false)
      setCatForm({ name: "", type: "Expenditure" })
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("新增失敗: " + (error.response?.data?.detail || error.message))
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
        
        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">新增 Log (交易)</TabsTrigger>
            <TabsTrigger value="category">新增 Category (類別)</TabsTrigger>
          </TabsList>
          
          {/* --- Log 表單 --- */}
          <TabsContent value="log" className="space-y-4 py-4">
            
            {/* 第一排：類別 | 收支類型 | 日期選擇 */}
            <div className="flex gap-2">
              {/* 1. 類別選擇 */}
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

              {/* 2. 收支類型選擇 (預設跟隨類別，可手動改) */}
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

              {/* 3. 日期與時間 Popover */}
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
                    {/* 時間選擇區塊 */}
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
                <Input 
                  type="number" 
                  id="amount" 
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
          
          {/* --- Category 表單 (保持不變) --- */}
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