import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api"
import { Trash2, Edit2, Plus, Save, X, ArrowUpDown } from "lucide-react"

export function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // 排序狀態: "asc" (升冪) 或 "desc" (降冪)
  const [sortOrder, setSortOrder] = useState("asc")

  // 新增/編輯用的暫存狀態
  const [tempData, setTempData] = useState({ name: "", default_type: "Expenditure" })

  const loadCategories = async () => {
    const data = await getCategories()
    setCategories(data)
  }

  useEffect(() => { loadCategories() }, [])

  // 排序邏輯：根據 ID 進行排序
  const sortedCategories = [...categories].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.id - b.id
    } else {
      return b.id - a.id
    }
  })

  // 切換排序函式
  const toggleSort = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc")
  }

  // 處理新增
  const handleCreate = async () => {
    if (!tempData.name) return alert("請輸入名稱")
    await createCategory(tempData.name, tempData.default_type)
    setIsAdding(false)
    setTempData({ name: "", default_type: "Expenditure" })
    loadCategories()
  }

  // 處理更新
  const handleUpdate = async (id) => {
    if (!tempData.name) return alert("請輸入名稱")
    await updateCategory(id, tempData.name, tempData.default_type)
    setEditingId(null)
    loadCategories()
  }

  // 處理刪除
  const handleDelete = async (name) => {
    if (confirm(`確定要刪除類別「${name}」嗎？`)) {
      try {
        await deleteCategory(name)
        loadCategories()
      } catch (e) {
        alert("刪除失敗，可能此類別尚有交易紀錄")
      }
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {/* [修正] 移除了 -ml-4，改用 h-8 px-2 讓按鈕乖乖待在單元格內 */}
              <TableHead className="w-[100px]">
                <Button 
                  variant="ghost" 
                  onClick={toggleSort}
                  className="h-8 px-2 hover:bg-accent hover:text-accent-foreground"
                >
                  ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>類別名稱</TableHead>
              <TableHead>預設類型</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 新增模式列 */}
            {isAdding && (
              <TableRow className="bg-muted/50">
                <TableCell>-</TableCell>
                <TableCell>
                  <Input value={tempData.name} onChange={e => setTempData({...tempData, name: e.target.value})} placeholder="名稱" />
                </TableCell>
                <TableCell>
                  <Select value={tempData.default_type} onValueChange={v => setTempData({...tempData, default_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Expenditure">支出</SelectItem>
                      <SelectItem value="Income">收入</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="icon" variant="ghost" onClick={handleCreate}><Save className="w-4 h-4 text-green-600"/></Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}><X className="w-4 h-4 text-red-600"/></Button>
                </TableCell>
              </TableRow>
            )}

            {/* 資料列表：使用 sortedCategories 進行渲染 */}
            {sortedCategories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.id}</TableCell>
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
                <TableCell className="text-right space-x-2">
                  {editingId === cat.id ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleUpdate(cat.id)}><Save className="w-4 h-4 text-green-600"/></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4"/></Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(cat.id); setTempData({name: cat.name, default_type: cat.default_type}) }}>
                        <Edit2 className="w-4 h-4 text-primary"/>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.name)}>
                        <Trash2 className="w-4 h-4 text-primary"/>
                      </Button>
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