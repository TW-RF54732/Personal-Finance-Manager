import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLog, getCategories } from "@/lib/api"

export function AddTransactionDialog({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  
  // 表單狀態
  const [formData, setFormData] = useState({
    amount: "",
    category_name: "",
    note: "",
    actual_type: "Expenditure" // 預設支出
  })

  // 開啟 Dialog 時載入類別
  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category_name) {
      alert("請填寫金額與類別")
      return
    }
    
    setLoading(true)
    try {
      await createLog({
        ...formData,
        amount: parseFloat(formData.amount)
      })
      setOpen(false)
      // 重置表單
      setFormData({ amount: "", category_name: "", note: "", actual_type: "Expenditure" }) 
      if (onSuccess) onSuccess() // 通知父層刷新
    } catch (error) {
      alert("新增失敗: " + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>新增交易</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增一筆紀錄</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          {/* 收支類型 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">類型</Label>
            <Select 
              value={formData.actual_type} 
              onValueChange={(val) => setFormData({...formData, actual_type: val})}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="選擇類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Expenditure">支出</SelectItem>
                <SelectItem value="Income">收入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 類別 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">類別</Label>
            <Select 
              value={formData.category_name} 
              onValueChange={(val) => setFormData({...formData, category_name: val})}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="選擇類別" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 金額 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">金額</Label>
            <Input
              id="amount"
              type="number"
              className="col-span-3"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0"
            />
          </div>

          {/* 備註 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note" className="text-right">備註</Label>
            <Input
              id="note"
              className="col-span-3"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              placeholder="選填"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}