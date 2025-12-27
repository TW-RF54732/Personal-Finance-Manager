import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconTrash, IconEdit } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconDots } from "@tabler/icons-react"

// 1. Dashboard 用的精簡版欄位
export const dashboardColumns = [
  {
    accessorKey: "timestamp",
    header: "日期",
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"))
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return <div className="text-muted-foreground">{`${year}-${month}-${day}`}</div>
    },
  },
  {
    accessorKey: "category",
    header: "類別",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
  },
  {
    accessorKey: "note",
    header: "備註",
    cell: ({ row }) => <div className="max-w-[150px] truncate">{row.getValue("note")}</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">金額</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const type = row.original.actual_type 
      const isIncome = type === "Income"
      return (
        <div className={`text-right font-medium ${isIncome ? "text-green-600" : "text-red-600"}`}>
          {isIncome ? "+" : "-"}${amount}
        </div>
      )
    },
  },
]

// 2. Data Library 用的完整版欄位 (包含 Actions)
export const getLibraryColumns = (onDelete) => [
  ...dashboardColumns, // 繼承原本的欄位
  {
    id: "actions",
    cell: ({ row }) => {
      const log = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDots className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(log.note)}>
              複製備註
            </DropdownMenuItem>
            {/* 這裡未來可以加編輯功能 */}
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(log.id)}>
              <IconTrash className="mr-2 h-4 w-4" />
              刪除紀錄
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]