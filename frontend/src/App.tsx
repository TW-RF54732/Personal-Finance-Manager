import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Wallet, TrendingDown, TrendingUp } from "lucide-react"; 

// 1. 定義資料型別 (TypeScript 的好處：定義清楚)
type Expense = {
  id: number;
  date: string;
  category: string;
  amount: number;
  note: string;
};

// 2. 假資料 (之後會換成從後端抓)
const initialExpenses: Expense[] = [
  { id: 1, date: "2023-12-20", category: "餐飲", amount: 120, note: "午餐吃拉麵" },
  { id: 2, date: "2023-12-21", category: "交通", amount: 50, note: "捷運儲值" },
  { id: 3, date: "2023-12-22", category: "娛樂", amount: 320, note: "看電影" },
  { id: 4, date: "2023-12-23", category: "購物", amount: 590, note: "Uniqlo 上衣" },
];

function App() {
  // 3. 狀態管理
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  // 計算總支出
  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* 標題與新增按鈕 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">我的記帳本</h1>
            <p className="text-slate-500 mt-1">紀錄每一筆開銷，掌握財務狀況</p>
          </div>
          <Button className="bg-slate-900 hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" /> 新增紀錄
          </Button>
        </div>

        {/* 數據卡片區 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總支出 (Total)</CardTitle>
              <Wallet className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAmount}</div>
              <p className="text-xs text-slate-500 mt-1">+20.1% 與上月相比</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月筆數</CardTitle>
              <TrendingDown className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length} 筆</div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">預算剩餘</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">$8,250</div>
            </CardContent>
          </Card>
        </div>

        {/* 記帳列表表格 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>近期收支明細</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">日期</TableHead>
                  <TableHead>類別</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.date}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">{expense.note}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      -${expense.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;