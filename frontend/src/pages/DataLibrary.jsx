import { useEffect, useState, useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { getEditableColumns } from "@/components/columns-editable"
import { CategoryManager } from "@/components/CategoryManager"
import { EditTransactionDialog } from "@/components/EditTransactionDialog"
import { fetchFilteredLogs, getCategories, deleteLog, updateLog } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, ArrowDownWideNarrow, ArrowUpNarrowWide, Settings2, X, Trash2, Check } from "lucide-react"
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
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

const getLast12Months = () => {
  const months = []
  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年 ${d.getMonth() + 1}月`
    months.push({ value, label })
  }
  return months
}

export default function DataLibrary() {
  const [tableLogs, setTableLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  
  // [新增] 1. 頁面初始載入延遲 (解決滑入卡頓)
  const [isReady, setIsReady] = useState(false)

  // [新增] 2. Tab 切換控制 (解決 Tab 動畫瞬移)
  const [activeTab, setActiveTab] = useState("logs")
  const [isTabAnimationDone, setIsTabAnimationDone] = useState(true)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [pageSize, setPageSize] = useState(10)

  const [batchCategory, setBatchCategory] = useState("")
  const [batchDirection, setBatchDirection] = useState("")

  const [filters, setFilters] = useState({
    month: (() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })(),
    category_name: "all",
    direction: "all",
    note_keyword: "",
    min_amount: "",
    max_amount: "",
    sort_by: "timestamp",
    reverse: true
  })

  const monthOptions = getLast12Months()

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  // [新增] 頁面掛載 350ms 後才設為 Ready，讓進入動畫先跑完
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 350)
    return () => clearTimeout(timer)
  }, [])

  const loadData = async () => {
    setLoading(true)
    let startIso, endIso
    if (filters.month) {
        const [year, month] = filters.month.split('-').map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)
        startIso = startDate.toISOString()
        endIso = endDate.toISOString()
    }

    const apiParams = {
      start_date: startIso,
      end_date: endIso,
      note_keyword: filters.note_keyword || null,
      min_amount: filters.min_amount ? parseFloat(filters.min_amount) : null,
      max_amount: filters.max_amount ? parseFloat(filters.max_amount) : null,
      category_name: filters.category_name === "all" ? null : filters.category_name,
      direction: filters.direction === "all" ? null : filters.direction,
      sort_by: filters.sort_by,
      reverse: filters.reverse,
      limit: 1000
    }

    const data = await fetchFilteredLogs(apiParams)
    setTableLogs(data || [])
    setLoading(false)
    setRowSelection({}) 
  }

  // [修改] 只有當 isReady 為 true 時才觸發數據加載
  useEffect(() => {
    if (!isReady) return; 
    loadData()
  }, [filters.month, isReady]) 

  // [新增] 處理 Tab 切換邏輯：人為製造延遲
  const handleTabChange = (value) => {
    setActiveTab(value)
    
    // 如果切換回交易紀錄，先將動畫狀態設為 false
    if (value === "logs") {
        setIsTabAnimationDone(false)
        // 等待 300ms (動畫結束) 後再允許渲染表格
        setTimeout(() => {
            setIsTabAnimationDone(true)
        }, 300)
    }
  }

  const handleEditClick = (log) => {
    setEditingLog(log)
    setEditDialogOpen(true)
  }

  const columns = useMemo(() => getEditableColumns(loadData, handleEditClick, isSelectionMode), [isSelectionMode])

  const handleReset = () => {
    setFilters(prev => ({
      ...prev,
      category_name: "all",
      direction: "all",
      note_keyword: "",
      min_amount: "",
      max_amount: "",
      sort_by: "timestamp",
      reverse: true
    }))
    setTimeout(loadData, 100)
  }

  const executeBatchDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number)
    if (selectedIndices.length === 0) return

    setLoading(true)
    try {
      const promises = selectedIndices.map(index => {
        const log = tableLogs[index]
        return deleteLog(log.id)
      })
      await Promise.all(promises)
      await loadData()
      setIsSelectionMode(false)
      toast.success(`成功刪除 ${selectedIndices.length} 筆資料`)
    } catch (e) {
      toast.error("批量刪除失敗: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchUpdateCategory = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number)
    if (selectedIndices.length === 0 || !batchCategory) return
    
    if(!confirm(`確定將選取的 ${selectedIndices.length} 筆資料類別改為「${batchCategory}」？`)) return

    setLoading(true)
    try {
      const promises = selectedIndices.map(index => {
        const log = tableLogs[index]
        return updateLog(log.id, {
            category_name: batchCategory,
            amount: log.amount,
            actual_type: log.actual_type,
            note: log.note,
            timestamp: log.timestamp
        })
      })
      await Promise.all(promises)
      await loadData()
      toast.success(`成功更新 ${selectedIndices.length} 筆資料類別`)
      setBatchCategory("") 
    } catch (e) {
        toast.error("批量修改失敗")
    } finally {
      setLoading(false)
    }
  }

  const handleBatchUpdateDirection = async () => {
    const selectedIndices = Object.keys(rowSelection).map(Number)
    if (selectedIndices.length === 0 || !batchDirection) return
    
    if(!confirm(`確定將選取的 ${selectedIndices.length} 筆資料類型改為「${batchDirection === 'Income' ? '收入' : '支出'}」？`)) return

    setLoading(true)
    try {
      const promises = selectedIndices.map(index => {
        const log = tableLogs[index]
        return updateLog(log.id, {
            category_name: log.category_name,
            amount: log.amount,
            actual_type: batchDirection,
            note: log.note,
            timestamp: log.timestamp
        })
      })
      await Promise.all(promises)
      await loadData()
      toast.success(`成功更新 ${selectedIndices.length} 筆資料類型`)
      setBatchDirection("")
    } catch (e) {
        toast.error("批量修改失敗")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">資料庫管理 (Data Library)</h2>
      </div>

      {/* [修改] 使用受控模式 (Controlled) 管理 Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">交易紀錄 (Logs)</TabsTrigger>
          <TabsTrigger value="categories">類別管理 (Categories)</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          
          <div className="flex flex-col gap-6 bg-muted/40 p-4 rounded-lg border">
            {/* 上半部：下拉選單區 */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="grid gap-2">
                    <span className="text-xs font-medium">月份</span>
                    <Select value={filters.month} onValueChange={(v) => setFilters({...filters, month: v})}>
                        <SelectTrigger className="w-[140px] bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        {monthOptions.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <span className="text-xs font-medium">收支類型</span>
                    <Select value={filters.direction} onValueChange={(v) => setFilters({...filters, direction: v})}>
                        <SelectTrigger className="w-[120px] bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="Income">收入 (Income)</SelectItem>
                        <SelectItem value="Expenditure">支出 (Expenditure)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <span className="text-xs font-medium">類別</span>
                    <Select value={filters.category_name} onValueChange={(v) => setFilters({...filters, category_name: v})}>
                        <SelectTrigger className="w-[140px] bg-background"><SelectValue placeholder="所有類別" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">所有類別</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                
                 <div className="grid gap-2">
                    <span className="text-xs font-medium">排序依據</span>
                    <div className="flex gap-1">
                        <Select value={filters.sort_by} onValueChange={(v) => setFilters({...filters, sort_by: v})}>
                            <SelectTrigger className="w-[110px] bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="timestamp">日期</SelectItem>
                            <SelectItem value="amount">金額</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            variant="outline" size="icon" className="bg-background"
                            onClick={() => setFilters({...filters, reverse: !filters.reverse})}
                            title={filters.reverse ? "降冪 (大到小/新到舊)" : "升冪 (小到大/舊到新)"}
                        >
                            {filters.reverse ? <ArrowDownWideNarrow className="h-4 w-4"/> : <ArrowUpNarrowWide className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 下半部：搜尋與重置按鈕 */}
            <div className="flex flex-wrap items-end gap-4 border-t pt-4 border-border/50">
                <div className="grid gap-2 grow max-w-[200px]">
                    <span className="text-xs font-medium">關鍵字搜尋</span>
                    <Input 
                        placeholder="搜尋備註..." 
                        className="bg-background"
                        value={filters.note_keyword}
                        onChange={(e) => setFilters({...filters, note_keyword: e.target.value})}
                    />
                </div>

                <div className="grid gap-2">
                    <span className="text-xs font-medium">金額範圍</span>
                    <div className="flex items-center gap-1">
                        <Input 
                        type="number" placeholder="Min" className="w-[80px] bg-background"
                        value={filters.min_amount}
                        onChange={(e) => setFilters({...filters, min_amount: e.target.value})}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input 
                        type="number" placeholder="Max" className="w-[80px] bg-background"
                        value={filters.max_amount}
                        onChange={(e) => setFilters({...filters, max_amount: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex gap-2 ml-auto">
                    <Button onClick={loadData} disabled={loading || !isReady}>
                        <Search className="w-4 h-4 mr-2" /> 搜尋
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" /> 重置
                    </Button>
                </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
             <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每頁顯示</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
             </div>

             <Button 
                variant={isSelectionMode ? "secondary" : "default"}
                onClick={() => {
                    if (isSelectionMode) setRowSelection({}) 
                    setIsSelectionMode(!isSelectionMode)
                }}
                className="w-[100px] transition-all"
             >
                {isSelectionMode ? (
                    <>
                        <X className="w-4 h-4 mr-2" /> 取消
                    </>
                ) : (
                    <>
                        <Settings2 className="w-4 h-4 mr-2" /> 編輯
                    </>
                )}
             </Button>
          </div>

          <div className="w-full overflow-hidden border rounded-md bg-background shadow-sm relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {(!isReady || !isTabAnimationDone) ? (
                // Loading 狀態：加上淡出動畫
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    {/* 可以加個簡單的 Spinner icon */}
                    <span className="animate-pulse">載入交易紀錄...</span>
                  </div>
                </motion.div>
              ) : (
                // 表格內容：加上滑入淡入動畫 (Slide Up + Fade In)
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full"
                >
                  <DataTable 
                    columns={columns} 
                    data={tableLogs} 
                    rowSelection={rowSelection}
                    setRowSelection={setRowSelection}
                    pageSize={pageSize}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </TabsContent>

        <TabsContent value="categories">
            <CategoryManager />
        </TabsContent>
      </Tabs>
      
      {isSelectionMode && Object.keys(rowSelection).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-primary text-primary-foreground p-4 rounded-lg shadow-xl flex flex-wrap items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <span className="font-semibold whitespace-nowrap">
                已選取 {Object.keys(rowSelection).length} 筆資料
            </span>
            
            <div className="h-6 w-px bg-primary-foreground/30 mx-2 hidden sm:block"></div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Trash2 className="w-4 h-4 mr-2" /> 刪除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確定要刪除選取的資料嗎？</AlertDialogTitle>
                  <AlertDialogDescription>
                    您已選取 {Object.keys(rowSelection).length} 筆資料。此動作無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={executeBatchDelete}>
                    確認刪除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex-1"></div>

            <div className="flex items-center gap-2">
                <Select value={batchCategory} onValueChange={setBatchCategory}>
                    <SelectTrigger className="w-[140px] h-8 bg-primary-foreground text-primary border-none">
                        <SelectValue placeholder="設定類別..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleBatchUpdateCategory} disabled={!batchCategory}>
                    <Check className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Select value={batchDirection} onValueChange={setBatchDirection}>
                    <SelectTrigger className="w-[110px] h-8 bg-primary-foreground text-primary border-none">
                        <SelectValue placeholder="設定類型..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Income">收入</SelectItem>
                        <SelectItem value="Expenditure">支出</SelectItem>
                    </SelectContent>
                </Select>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleBatchUpdateDirection} disabled={!batchDirection}>
                    <Check className="w-4 h-4" />
                </Button>
            </div>

        </div>
      )}

      <EditTransactionDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        logData={editingLog}
        onSuccess={loadData}
      />
    </div>
  )
}