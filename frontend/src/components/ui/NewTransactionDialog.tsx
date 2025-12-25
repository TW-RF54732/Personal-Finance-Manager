import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Shadcn 的工具

// 預定義的類別清單
const EXPENSE_CATEGORIES = [
  { id: "food", name: "餐飲", emoji: "🍜" },
  { id: "drink", name: "飲料", emoji: "🥤" },
  { id: "transport", name: "交通", emoji: "🚇" },
  { id: "shopping", name: "購物", emoji: "🛍️" },
  { id: "entertainment", name: "娛樂", emoji: "🎮" },
  { id: "house", name: "居家", emoji: "🏠" },
];

const INCOME_CATEGORIES = [
  { id: "salary", name: "薪水", emoji: "💰" },
  { id: "bonus", name: "獎金", emoji: "💎" },
  { id: "investment", name: "投資", emoji: "📈" },
  { id: "other", name: "其他", emoji: "🙋" },
];

// 定義這個元件需要接收什麼參數 (Props)
interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void; // 當按下儲存時，把資料傳回給爸爸
}

export function AddTransactionDialog({ open, onOpenChange, onSave }: AddTransactionDialogProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // 預設今天
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]);

  // 當按下「儲存紀錄」
  const handleSubmit = () => {
    if (!amount) return alert("請輸入金額！");
    
    // 把資料打包傳出去
    onSave({
      type,
      amount: Number(amount),
      date,
      note: note || selectedCategory.name, // 如果沒寫備註，就用類別名稱代替
      category: selectedCategory.name,
      emoji: selectedCategory.emoji,
    });

    // 重置表單並關閉
    setAmount("");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-slate-700">
            新增一筆紀錄
          </DialogTitle>
        </DialogHeader>

        {/* 1. 支出/收入 切換 */}
        <Tabs defaultValue="expense" value={type} onValueChange={(v: any) => setType(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="expense" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">支出</TabsTrigger>
            <TabsTrigger value="income" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">收入</TabsTrigger>
          </TabsList>

          {/* 2. 金額輸入 (特大字體) */}
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Label className="text-slate-400 text-xs">金額</Label>
            <div className="relative flex items-center justify-center w-full">
              <span className={`text-3xl font-bold absolute left-8 ${type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {type === 'expense' ? '-' : '+'}
              </span>
              <Input 
                type="number" 
                placeholder="0" 
                className="text-center text-4xl font-bold border-none shadow-none focus-visible:ring-0 w-1/2 h-16 placeholder:text-slate-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* 3. 類別選擇 (Grid 排版) */}
          <div className="space-y-3 mt-2">
            <Label className="text-slate-500 text-sm font-bold ml-1">選擇類別</Label>
            <div className="grid grid-cols-4 gap-3">
              {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                    selectedCategory.id === cat.id 
                      ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10" 
                      : "border-slate-100 hover:bg-slate-50 text-slate-400 grayscale hover:grayscale-0"
                  )}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. 日期與備註 */}
          <div className="grid grid-cols-2 gap-4 mt-6">
             <div className="space-y-2">
               <Label>日期</Label>
               <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
             </div>
             <div className="space-y-2">
               <Label>備註</Label>
               <Input 
                  placeholder="輸入備註..." 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                />
             </div>
          </div>

          {/* 5. 底部按鈕 */}
          <Button 
            className={`w-full mt-6 h-12 text-lg font-bold shadow-lg transition-transform active:scale-95 ${
              type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            onClick={handleSubmit}
          >
            儲存紀錄
          </Button>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}