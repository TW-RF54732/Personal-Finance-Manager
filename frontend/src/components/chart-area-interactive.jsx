"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

// 1. 設定顏色：黑色與灰色
const chartConfig = {
  income: {
    label: "累積收入",
    color: "hsl(0, 0%, 0%)",      // 黑色
  },
  expense: {
    label: "累積支出",
    color: "hsl(240, 5%, 64.9%)", // 灰色 (Zinc-400/500)
  },
}

// 2. 客製化 Tooltip 組件
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // payload[0].payload 包含我們在 chartData 塞進去的原始資料
    const data = payload[0].payload;
    
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg text-sm min-w-[180px]">
        {/* 日期時間 */}
        <div className="mb-2 font-medium text-muted-foreground text-xs">
          {new Date(label).toLocaleDateString("zh-TW", {
            month: "numeric", day: "numeric"
          })}
          {" "}
          {new Date(label).toLocaleTimeString("zh-TW", {
             hour: '2-digit', minute:'2-digit'
          })}
        </div>

        {/* 核心資訊：顯示「這筆是什麼？」 */}
        <div className="mb-3 pb-3 border-b border-border">
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-base">{data.category}</span>
                <span className={`font-mono font-bold ${data.originalType === 'Income' ? 'text-black' : 'text-gray-500'}`}>
                    {data.originalType === 'Income' ? '+' : '-'}${data.originalAmount}
                </span>
            </div>
            <div className="text-xs text-muted-foreground">
                最新交易項目
            </div>
        </div>

        {/* 累積數據展示 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col">
                <span className="text-muted-foreground uppercase tracking-wider mb-0.5">累積收入</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-black" />
                    <span className="font-bold font-mono text-base text-foreground">
                        ${data.income.toLocaleString()}
                    </span>
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-muted-foreground uppercase tracking-wider mb-0.5">累積支出</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="font-bold font-mono text-base text-gray-500">
                        ${data.expense.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ChartAreaInteractive({ rawLogs = [] }) {
  // 3. 資料轉換：計算累積並保留類別資訊
  const chartData = React.useMemo(() => {
    if (!rawLogs || rawLogs.length === 0) return []

    let accIncome = 0
    let accExpense = 0

    return rawLogs.map((log) => {
      if (log.actual_type === "Income") {
        accIncome += log.amount
      } else {
        accExpense += log.amount
      }

      return {
        date: log.timestamp,
        income: accIncome,
        expense: accExpense,
        // 以下欄位是給 Tooltip 用的
        originalAmount: log.amount,
        originalType: log.actual_type,
        category: log.category, 
      }
    })
  }, [rawLogs])

  return (
    <Card>
      <CardHeader>
        <CardTitle>本月收支趨勢</CardTitle>
        {/* <CardDescription>
          黑色代表收入累積，灰色代表支出累積
        </CardDescription> */}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              {/* 黑色漸層 (收入) */}
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
              </linearGradient>
              
              {/* 灰色漸層 (支出) */}
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("zh-TW", { day: "numeric" })
              }}
            />
            
            {/* 使用我們自定義的 Tooltip */}
            <ChartTooltip cursor={false} content={<CustomTooltip />} />
            
            {/* 灰色區域 (支出) */}
            <Area
              dataKey="expense"
              type="natural"
              fill="url(#fillExpense)"
              stroke="var(--color-expense)"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            
            {/* 黑色區域 (收入) */}
            <Area
              dataKey="income"
              type="natural"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}