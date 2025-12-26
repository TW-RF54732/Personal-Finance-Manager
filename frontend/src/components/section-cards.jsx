import { IconTrendingDown, IconTrendingUp, IconTargetArrow } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards({ income, expense, netSavings, savingsRate, goalData }) {
  const formatMoney = (amount) => `$${Number(amount).toLocaleString()}`

  // 輔助函式：產生 Badge 內容 (移除顏色邏輯)
  const getTrendInfo = (percentage) => {
    if (percentage === undefined || percentage === null) {
        return null
    }

    const val = Number(percentage)
    const isPositive = val >= 0
    // 根據正負值決定箭頭方向
    const Icon = isPositive ? IconTrendingUp : IconTrendingDown
    
    return {
      icon: Icon,
      text: `${val > 0 ? '+' : ''}${val}%`,
      // 移除顏色 class，改用預設文字顏色
      iconClass: "text-foreground", 
      textClass: "text-foreground"
    }
  }

  const incomeTrend = getTrendInfo(goalData?.income?.percentage)
  const expenseTrend = getTrendInfo(goalData?.expenditure?.percentage)
  const saveTrend = getTrendInfo(goalData?.total_save?.percentage)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      
      {/* 1. 總收入 */}
      <Card>
        <CardHeader>
          <CardDescription>總收入 (Total Income)</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {formatMoney(income)}
          </CardTitle>
          <CardAction>
            {incomeTrend && (
              <Badge variant="outline" className="gap-1">
                <incomeTrend.icon className={`size-3 ${incomeTrend.iconClass}`} />
                <span className={incomeTrend.textClass}>{incomeTrend.text}</span>
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconTargetArrow className="size-4" />
            <span>目標: {formatMoney(goalData?.income?.goal || 0)}</span>
          </div>
        </CardFooter>
      </Card>

      {/* 2. 總支出 */}
      <Card>
        <CardHeader>
          <CardDescription>總支出 (Total Expense)</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {formatMoney(expense)}
          </CardTitle>
          <CardAction>
             {expenseTrend && (
              <Badge variant="outline" className="gap-1">
                <expenseTrend.icon className={`size-3 ${expenseTrend.iconClass}`} />
                <span className={expenseTrend.textClass}>{expenseTrend.text}</span>
              </Badge>
             )}
          </CardAction>
        </CardHeader>
        <CardFooter>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconTargetArrow className="size-4" />
            <span>目標: {formatMoney(goalData?.expenditure?.goal || 0)}</span>
          </div>
        </CardFooter>
      </Card>

      {/* 3. 淨結餘 */}
      <Card>
        <CardHeader>
          <CardDescription>淨結餘 (Net Savings)</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {formatMoney(netSavings)}
          </CardTitle>
          <CardAction>
            {saveTrend && (
              <Badge variant="outline" className="gap-1">
                <saveTrend.icon className={`size-3 ${saveTrend.iconClass}`} />
                <span className={saveTrend.textClass}>{saveTrend.text}</span>
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconTargetArrow className="size-4" />
            <span>目標: {formatMoney(goalData?.total_save?.goal || 0)}</span>
          </div>
        </CardFooter>
      </Card>

      {/* 4. 儲蓄率 (移除目標與箭頭) */}
      <Card>
        <CardHeader>
          <CardDescription>儲蓄率 (Savings Rate)</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {savingsRate}
          </CardTitle>
          {/* 這裡移除了 CardAction (箭頭) */}
        </CardHeader>
        {/* 這裡移除了 CardFooter (目標) */}
      </Card>

    </div>
  )
}