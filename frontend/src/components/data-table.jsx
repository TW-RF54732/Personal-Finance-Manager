import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel, // [新增] 引入分頁模型
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button" // [新增] 引入按鈕
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react" // [新增] 引入 icon

const columns = [
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
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("note")}</div>,
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

export function DataTable({ data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // [新增] 啟用分頁
    initialState: {
      pagination: {
        pageSize: 10, // [新增] 預設每頁 10 筆
      },
    },
  })

  return (
    <div className="space-y-4"> {/* 包裹一層 div 以處理間距 */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  沒有交易紀錄
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* [新增] 分頁控制區 */}
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
           第 {table.getState().pagination.pageIndex + 1} 頁，共 {table.getPageCount()} 頁
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft className="h-4 w-4" />
            上一頁
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一頁
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}