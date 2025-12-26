import { IconTrendingDown, IconTrendingUp, IconTargetArrow } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  // [修改] 移除 CardAction，改用 Flexbox 排版避免出框
} from "@/components/ui/card"

export function SectionCards({ income, expense, netSavings, savingsRate, goalData }) {
  const formatMoney = (amount) => `$${Number(amount).toLocaleString()}`

  const getTrendInfo = (percentage) => {
    if (percentage === undefined || percentage === null) return null
    const val = Number(percentage)
    const isPositive = val >= 0
    const Icon = isPositive ? IconTrendingUp : IconTrendingDown
    
    return {
      icon: Icon,
      text: `${val > 0 ? '+' : ''}${val}%`,
      iconClass: "text-foreground", 
      textClass: "text-foreground"
    }
  }

  const incomeTrend = getTrendInfo(goalData?.income?.percentage)
  const expenseTrend = getTrendInfo(goalData?.expenditure?.percentage)
  const saveTrend = getTrendInfo(goalData?.total_save?.percentage)

  return (
    // [修改] 調整 Grid 斷點：
    // sm:grid-cols-2 -> 平板/小筆電時顯示 2 欄 (避免太擠)
    // xl:grid-cols-4 -> 只有在大螢幕 (1280px+) 才顯示 4 欄
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      
      {/* 1. 總收入 */}
      <Card>
        <CardHeader className="pb-2">
          {/* [修改] 使用 Flexbox 將描述與 Badge 分開，確保不出框 */}
          <div className="flex items-center justify-between">
            <CardDescription>總收入 (Total Income)</CardDescription>
            {incomeTrend && (
              <Badge variant="outline" className="gap-1 ml-2 shrink-0">
                <incomeTrend.icon className={`size-3 ${incomeTrend.iconClass}`} />
                <span className={incomeTrend.textClass}>{incomeTrend.text}</span>
              </Badge>
            )}
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums mt-2">
            {formatMoney(income)}
          </CardTitle>
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>總支出 (Total Expense)</CardDescription>
            {expenseTrend && (
              <Badge variant="outline" className="gap-1 ml-2 shrink-0">
                <expenseTrend.icon className={`size-3 ${expenseTrend.iconClass}`} />
                <span className={expenseTrend.textClass}>{expenseTrend.text}</span>
              </Badge>
            )}
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums mt-2">
            {formatMoney(expense)}
          </CardTitle>
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>淨結餘 (Net Savings)</CardDescription>
            {saveTrend && (
              <Badge variant="outline" className="gap-1 ml-2 shrink-0">
                <saveTrend.icon className={`size-3 ${saveTrend.iconClass}`} />
                <span className={saveTrend.textClass}>{saveTrend.text}</span>
              </Badge>
            )}
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums mt-2">
            {formatMoney(netSavings)}
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconTargetArrow className="size-4" />
            <span>目標: {formatMoney(goalData?.total_save?.goal || 0)}</span>
          </div>
        </CardFooter>
      </Card>

      {/* 4. 儲蓄率 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>儲蓄率 (Savings Rate)</CardDescription>
            {/* 這裡原本就沒有 Badge，保持原樣或加上空的佔位符 */}
          </div>
          <CardTitle className="text-3xl font-semibold tabular-nums mt-2">
            {savingsRate}
          </CardTitle>
        </CardHeader>
      </Card>

    </div>
  )
}