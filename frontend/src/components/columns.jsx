import { ArrowUpDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteLog } from "@/lib/api"

// 使用工廠模式 (Factory Pattern) 傳入 refreshData 回調函式
export const getColumns = (refreshData) => [
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            日期
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        const date = new Date(row.getValue("timestamp"))
        return <div>{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    }
  },
  {
    accessorKey: "category_name",
    header: "類別",
  },
  {
    accessorKey: "note",
    header: "備註",
  },
  {
    accessorKey: "amount",
    header: "金額",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const type = row.original.actual_type
      const color = type === "Income" ? "text-green-600" : "text-red-600"
      const prefix = type === "Income" ? "+" : "-"
      return <div className={`font-medium ${color}`}>{prefix}${amount}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const log = row.original
 
      const handleDelete = async () => {
        if (confirm(`確定要刪除這筆 $${log.amount} 的紀錄嗎？`)) {
            try {
                await deleteLog(log.id)
                refreshData() // 刪除成功後刷新表格
            } catch (e) {
                alert("刪除失敗")
            }
        }
      }
 
      return (
        <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
        </Button>
      )
    },
  },
]