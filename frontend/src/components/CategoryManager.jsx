import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api"
import { Trash2, Edit2, Plus, Save, X, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [sortOrder, setSortOrder] = useState("asc")
  const [tempData, setTempData] = useState({ name: "", default_type: "Expenditure" })

  const loadCategories = async () => {
    const data = await getCategories()
    setCategories(data)
  }

  useEffect(() => { loadCategories() }, [])

  const sortedCategories = [...categories].sort((a, b) => {
    return sortOrder === "asc" ? a.id - b.id : b.id - a.id
  })

  const toggleSort = () => setSortOrder(prev => prev === "asc" ? "desc" : "asc")

  const handleCreate = async () => {
    if (!tempData.name) return toast.error("請輸入名稱")
    
    try {
      await createCategory(tempData.name, tempData.default_type)
      setIsAdding(false)
      setTempData({ name: "", default_type: "Expenditure" })
      loadCategories()
      toast.success("類別新增成功")
    } catch (e) {
      toast.error("新增失敗: " + e.message)
    }
  }

  const handleUpdate = async (id) => {
    if (!tempData.name) return toast.error("請輸入名稱")
    try {
      await updateCategory(id, tempData.name, tempData.default_type)
      setEditingId(null)
      loadCategories()
      toast.success("類別更新成功")
    } catch (e) {
      toast.error("更新失敗: " + e.message)
    }
  }

  const handleDelete = async (name) => {
    try {
      await deleteCategory(name)
      loadCategories()
      toast.success("類別刪除成功")
    } catch (e) {
      toast.error("刪除失敗，可能此類別尚有交易紀錄")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">類別列表</h3>
        <Button size="sm" onClick={() => { setIsAdding(true); setTempData({name:"", default_type:"Expenditure"}) }}>
          <Plus className="w-4 h-4 mr-1" /> 新增類別
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">
                <Button 
                  variant="ghost" 
                  onClick={toggleSort}
                  className="h-8 px-2 hover:bg-background"
                >
                  ID <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>類別名稱</TableHead>
              <TableHead>預設類型</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow className="bg-muted/30 animate-in slide-in-from-top-2">
                <TableCell>-</TableCell>
                <TableCell>
                  <Input value={tempData.name} onChange={e => setTempData({...tempData, name: e.target.value})} placeholder="名稱" className="bg-background" />
                </TableCell>
                <TableCell>
                  <Select value={tempData.default_type} onValueChange={v => setTempData({...tempData, default_type: v})}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Expenditure">支出</SelectItem>
                      <SelectItem value="Income">收入</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={handleCreate} className="hover:bg-primary/10">
                    <Save className="w-4 h-4 text-primary"/>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)} className="hover:bg-primary/10">
                    <X className="w-4 h-4 text-primary"/>
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {sortedCategories.map((cat) => (
              <TableRow key={cat.id} className="group">
                <TableCell className="font-mono text-muted-foreground">{cat.id}</TableCell>
                <TableCell>
                  {editingId === cat.id ? (
                    <Input value={tempData.name} onChange={e => setTempData({...tempData, name: e.target.value})} />
                  ) : cat.name}
                </TableCell>
                <TableCell>
                  {editingId === cat.id ? (
                     <Select value={tempData.default_type} onValueChange={v => setTempData({...tempData, default_type: v})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Expenditure">支出</SelectItem>
                       <SelectItem value="Income">收入</SelectItem>
                     </SelectContent>
                   </Select>
                  ) : (cat.default_type === "Income" ? "收入" : "支出")}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {editingId === cat.id ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleUpdate(cat.id)} className="hover:bg-primary/10">
                        <Save className="w-4 h-4 text-primary"/>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="hover:bg-muted">
                        <X className="w-4 h-4 text-muted-foreground"/>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(cat.id); setTempData({name: cat.name, default_type: cat.default_type}) }} className="opacity-70 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-4 h-4 text-primary"/>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          {/* [修改] 移除紅色，改用 Primary */}
                          <Button size="icon" variant="ghost" className="opacity-70 group-hover:opacity-100 transition-opacity hover:bg-primary/10">
                            <Trash2 className="w-4 h-4 text-primary"/>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>確定要刪除類別「{cat.name}」嗎？</AlertDialogTitle>
                            <AlertDialogDescription>
                              此動作無法復原。如果此類別下已有交易紀錄，刪除可能會失敗。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            {/* [修改] 確認按鈕改用 Default (Primary) */}
                            <AlertDialogAction onClick={() => handleDelete(cat.name)}>
                              刪除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}