import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const getReadonlyColumns = () => [
  {
    accessorKey: "timestamp",
    // [設定寬度]
    meta: { className: "w-[180px]" },
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
    // [設定寬度]
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
    // 備註不設寬度，自動填滿
    header: "備註",
    cell: ({ row }) => (
        <div className="truncate max-w-[400px]" title={row.getValue("note")}>
          {row.getValue("note")}
        </div>
      )
  },
  {
    accessorKey: "amount",
    // [設定寬度]
    meta: { className: "w-[140px]" },
    header: "金額",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const type = row.original.actual_type
      const prefix = type === "Income" ? "+" : "-"
      return <div className="font-medium">{prefix}${amount}</div>
    },
  },
]