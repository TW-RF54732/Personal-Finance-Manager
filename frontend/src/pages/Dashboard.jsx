import { useEffect, useState, useMemo } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { DataTable } from "@/components/data-table" 
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
// [修改] 移除 AddTransactionDialog，改用與 Header 相同的 AddDialog
import { AddDialog } from "@/components/add-dialog"
import { fetchAnalysisReport, fetchMonthlyLogs, fetchMonthlyLogsForTable, fetchGoalReport } from "@/lib/api"
import { getReadonlyColumns } from "@/components/columns-readonly"

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

export default function Dashboard() {
  const [reportData, setReportData] = useState(null)
  const [chartLogs, setChartLogs] = useState([])
  const [tableLogs, setTableLogs] = useState([]) 
  const [goalData, setGoalData] = useState(null)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const monthOptions = getLast12Months()

  const loadData = async () => {
    if (!selectedMonth) return

    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const startIso = startDate.toISOString()
    const endIso = endDate.toISOString()
    const startDayStr = startDate.toISOString().split('T')[0]
    const endDayStr = endDate.toISOString().split('T')[0]

    const [reportRes, tableRes, chartRes, goalRes] = await Promise.all([
      fetchAnalysisReport(startIso, endIso),
      fetchMonthlyLogsForTable(startIso, endIso), 
      fetchMonthlyLogs(startIso, endIso),
      fetchGoalReport(startDayStr, endDayStr)
    ])

    if (reportRes?.status === "success" && reportRes?.data) {
      setReportData(reportRes.data)
    } else {
      setReportData(null) 
    }

    if (tableRes) setTableLogs(tableRes)
    if (chartRes) setChartLogs(chartRes)
    if (goalRes) setGoalData(goalRes)
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  const columns = useMemo(() => getReadonlyColumns(), [])

  const metrics = reportData?.metrics || {}

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">財務概覽</h2>
          
          <div className="flex items-center gap-4">
            {/* [修改] 這裡現在使用的是 AddDialog，功能與 Header 上的一致 */}
            <AddDialog onSuccess={loadData} />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">月份：</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="選擇月份" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SectionCards 
          income={metrics.total_income || 0}
          expense={metrics.total_expense || 0}
          netSavings={metrics.net_savings || 0}
          savingsRate={metrics.savings_rate || "0%"}
          goalData={goalData?.details} 
        />
        
        <div className="flex flex-col gap-6">
          <div className="w-full">
            <ChartAreaInteractive rawLogs={chartLogs} />
          </div>
          <div className="w-full overflow-hidden">
            <DataTable columns={columns} data={tableLogs} />
          </div>
        </div>
    </div>
  )
}