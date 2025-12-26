import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateLog, getCategories } from "@/lib/api"

export function EditTransactionDialog({ open, onOpenChange, logData, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (open) {
      getCategories().then(setCategories)
      // 初始化表單資料
      setFormData({
        category_name: logData?.category_name || "",
        amount: logData?.amount || "",
        note: logData?.note || "",
        actual_type: logData?.actual_type || "Expenditure",
        timestamp: logData?.timestamp || new Date().toISOString()
      })
    }
  }, [open, logData])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await updateLog(logData.id, {
        ...formData,
        amount: parseFloat(formData.amount)
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      alert("更新失敗: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>編輯紀錄</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">類型</Label>
            <Select 
              value={formData.actual_type} 
              onValueChange={(val) => setFormData({...formData, actual_type: val})}
            >
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Expenditure">支出</SelectItem>
                <SelectItem value="Income">收入</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">類別</Label>
            <Select 
              value={formData.category_name} 
              onValueChange={(val) => setFormData({...formData, category_name: val})}
            >
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">金額</Label>
            <Input
              type="number"
              className="col-span-3"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">備註</Label>
            <Input
              className="col-span-3"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "更新中..." : "更新"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}