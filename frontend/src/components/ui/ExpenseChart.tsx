import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction } from "@/pages/Dashboard";
import { TrendingDown, TrendingUp } from "lucide-react";

// 🎨 支出配色 (暖色/警示系)
const EXPENSE_COLORS = [
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

// 💰 收入配色 (冷色/財富系)
const INCOME_COLORS = [
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#64748b", // Slate
];

interface ExpenseChartProps {
  data: Transaction[];
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  
  // --- 資料處理核心邏輯 ---
  const processData = (type: "expense" | "income") => {
    const filtered = data.filter(t => t.type === type);
    const grouped = filtered.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { name: curr.category, value: 0, emoji: curr.emoji };
      }
      acc[curr.category].value += curr.amount;
      return acc;
    }, {} as Record<string, { name: string; value: number; emoji: string }>);
    return Object.values(grouped).sort((a, b) => b.value - a.value);
  };

  const expenseData = useMemo(() => processData("expense"), [data]);
  const incomeData = useMemo(() => processData("income"), [data]);

  const totalExpense = expenseData.reduce((acc, curr) => acc + curr.value, 0);
  const totalIncome = incomeData.reduce((acc, curr) => acc + curr.value, 0);

  // --- 共用的圖表渲染函式 ---
  const renderSection = (title: string, icon: React.ReactNode, chartData: any[], total: number, colors: string[], emptyText: string) => {
    return (
      <div className="flex flex-col gap-4">
        {/* 標題區 */}
        <h3 className="text-slate-500 font-bold pl-2 flex items-center gap-2 text-sm uppercase tracking-wider">
          {icon} {title}
        </h3>

        {/* 內容區 */}
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="text-3xl mb-2 opacity-50">📊</div>
            <p className="text-sm">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. 甜甜圈圖 */}
            <div className="h-64 bg-white rounded-3xl p-4 shadow-sm relative border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: number | string | undefined) => {
                      if (value === undefined) return "$0";
                      return `$${Number(value).toLocaleString()}`;
                    }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* 中間總金額 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-xs text-slate-400 font-bold mb-1">Total</div>
                <div className="text-xl font-bold text-slate-800">${total.toLocaleString()}</div>
              </div>
            </div>

            {/* 2. 排行榜列表 */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
              {chartData.map((item, index) => {
                const percent = ((item.value / total) * 100).toFixed(1);
                const color = colors[index % colors.length];
                
                return (
                  <div key={item.name} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* 排名球 (顏色跟隨圖表) */}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                           style={{ backgroundColor: color }}>
                        {index + 1}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-lg bg-slate-100 rounded-md p-1">{item.emoji}</span>
                        <span className="font-bold text-slate-700">{item.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end w-32">
                      <span className="font-bold text-slate-800">$ {item.value.toLocaleString()}</span>
                      <div className="flex items-center gap-2 w-full justify-end">
                         {/* 進度條 (顏色跟隨圖表) */}
                         <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ width: `${percent}%`, backgroundColor: color }} 
                            />
                         </div>
                         <span className="text-xs text-slate-400 w-8 text-right">{percent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-10">
      {/* 區塊一：支出 */}
      {renderSection(
        "支出分布 (Expenses)", 
        <TrendingDown className="h-4 w-4 text-rose-500" />,
        expenseData, 
        totalExpense, 
        EXPENSE_COLORS, 
        "本月尚無支出紀錄"
      )}

      {/* 分隔線 (如果兩個都有資料才顯示) */}
      {totalExpense > 0 && totalIncome > 0 && (
         <div className="h-px bg-slate-200 w-full" />
      )}

      {/* 區塊二：收入 */}
      {renderSection(
        "收入來源 (Income)", 
        <TrendingUp className="h-4 w-4 text-emerald-500" />,
        incomeData, 
        totalIncome, 
        INCOME_COLORS, 
        "本月尚無收入紀錄"
      )}
    </div>
  );
}