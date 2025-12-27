import { ArrowUpDown, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteLog } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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

const formatDate = (dateString) => {
  if (!dateString) return ""
  const d = new Date(dateString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const getEditableColumns = (refreshData, onEdit, isSelectionMode) => {
  const columns = [
    {
      accessorKey: "timestamp",
      meta: { className: "w-[180px]" },
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          日期 <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
          return <div className="font-mono text-sm">{formatDate(row.getValue("timestamp"))}</div>
      }
    },
    {
      accessorKey: "category_name",
      meta: { className: "w-[140px]" },
      header: "類別",
      cell: ({ row }) => {
          const val = row.original.category_name || row.original.category || "未分類";
          const name = typeof val === 'object' ? val.name : val;
          return <Badge variant="outline">{name}</Badge>
      }
    },
    {
      accessorKey: "note",
      header: "備註",
      cell: ({ row }) => (
        <div className="truncate max-w-[500px]" title={row.getValue("note")}>
          {row.getValue("note")}
        </div>
      )
    },
    {
      accessorKey: "amount",
      meta: { className: "w-[140px]" },
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          金額 <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const type = row.original.actual_type
        const prefix = type === "Income" ? "+" : "-"
        return <div className="font-medium">{prefix}${amount}</div>
      },
    },
    {
      id: "actions",
      meta: { className: "w-[100px]" },
      cell: ({ row }) => {
        const log = row.original
   
        const handleDelete = async () => {
            await deleteLog(log.id)
            refreshData()
        }
   
        return (
          <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => onEdit(log)} className="hover:bg-primary/10">
                  <Edit className="h-4 w-4 text-primary" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  {/* [修改] 移除 destructive 相關樣式，統一用 primary */}
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                      <Trash2 className="h-4 w-4 text-primary" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確定要刪除這筆紀錄嗎？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此動作無法復原。
                      <br />
                      <span className="font-mono mt-2 block text-foreground">
                        {log.category_name} - ${log.amount} ({formatDate(log.timestamp)})
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    {/* [修改] 確認按鈕改用預設樣式 (Primary Color) */}
                    <AlertDialogAction onClick={handleDelete}>
                      刪除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
        )
      },
    },
  ]

  if (isSelectionMode) {
    columns.unshift({
      id: "select",
      meta: { className: "w-[50px]" },
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="translate-y-[2px] w-4 h-4 accent-primary"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="translate-y-[2px] w-4 h-4 accent-primary"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    })
  }

  return columns
}