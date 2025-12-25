import { useState, useMemo } from "react"; // 引入 useMemo 優化效能
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, PieChart, FileText, List, TrendingUp, TrendingDown, Calendar, Bot} from "lucide-react";
import { AddTransactionDialog } from "@/components/ui/NewTransactionDialog";
import { ExpenseChart } from "@/components/ui/ExpenseChart";
// 1. 引入 Select 元件
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 定義資料型別
export type Transaction = {
	id: number;
	date: string;
	type: "expense" | "income";
	amount: number;
	category: string;
	emoji: string;
	note: string;
};

// 假資料 (多加幾筆不同月份的資料以便測試)
const mockData: Transaction[] = [
	{ id: 1, date: "2025-11-04", type: "expense", amount: 120, category: "餐飲", emoji: "🍜", note: "午餐牛肉麵" },
	{ id: 2, date: "2025-11-04", type: "expense", amount: 45, category: "飲料", emoji: "🥤", note: "珍奶微糖" },
	{ id: 3, date: "2025-11-04", type: "income", amount: 5000, category: "薪水", emoji: "💰", note: "家教費入帳" },
	{ id: 4, date: "2025-11-03", type: "expense", amount: 300, category: "交通", emoji: "⛽", note: "機車加油" },
	{ id: 5, date: "2025-10-20", type: "expense", amount: 2500, category: "娛樂", emoji: "🎤", note: "10月的 KTV" }, // 10月的資料
	{ id: 6, date: "2025-12-01", type: "expense", amount: 1500, category: "購物", emoji: "🧥", note: "12月買外套" }, // 12月的資料
];

function Dashboard() {
	const [transactions, setTransactions] = useState<Transaction[]>(mockData);
	// 2. 狀態改成儲存 "YYYY-MM" 字串，預設 "all"
	const [selectedMonth, setSelectedMonth] = useState<string>("all");
	const [activeTab, setActiveTab] = useState<"details" | "chart" | "report">("details");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// --- 邏輯 A: 自動計算出資料裡有哪些月份 ---
	const availableMonths = useMemo(() => {
		const months = new Set(transactions.map((t) => t.date.slice(0, 7))); // 取出 "YYYY-MM"
		// 轉成陣列並排序 (新到舊)
		return Array.from(months).sort((a, b) => b.localeCompare(a));
	}, [transactions]);

	// --- 邏輯 B: 根據選擇的月份篩選資料 ---
	const filteredTransactions = useMemo(() => {
		if (selectedMonth === "all") return transactions;
		return transactions.filter((t) => t.date.startsWith(selectedMonth));
	}, [transactions, selectedMonth]);

	// --- 邏輯 C: 統計數據 (注意：現在是用 filteredTransactions 來算！) ---
	const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((acc, curr) => acc + curr.amount, 0);

	const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((acc, curr) => acc + curr.amount, 0);

	const balance = totalIncome - totalExpense;

	// --- 邏輯 D: 資料分組 (依照日期) ---
	const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
		const date = transaction.date;
		if (!groups[date]) groups[date] = [];
		groups[date].push(transaction);
		return groups;
	}, {} as Record<string, Transaction[]>);

	const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

	const formatDateDisplay = (dateString: string) => {
		const date = new Date(dateString);
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const weekDay = date.toLocaleDateString("zh-TW", { weekday: "short" });
		return `${month}月${day}日 ${weekDay}`;
	};

	// 小幫手：把 "2025-11" 轉成 "2025年 11月"
	const formatMonthOption = (ym: string) => {
		const [y, m] = ym.split("-");
		return `${y}年 ${m}月`;
	};

	const handleSaveTransaction = (newData: any) => {
		const newTransaction: Transaction = {
			id: Date.now(),
			...newData,
		};
		setTransactions([newTransaction, ...transactions]);

		// 如果新增的資料不在目前選的月份，貼心地自動切換到 "全部" 或該月份
		// (這裡暫時不強制切換，避免使用者困惑)
	};

	return (
		<div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
			<AddTransactionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSaveTransaction} />

			<div className="w-full lg:w-1/2 max-w-4xl space-y-6">
				{/* --- 頂部核心區塊 --- */}
				<div className="bg-slate-900 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
					<div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-800 rounded-full opacity-40 blur-3xl"></div>

					{/* 3. 修改重點：將原本的 Div 換成 Select 元件 */}
					<div className="flex justify-start mb-8 relative z-10">
						<Select value={selectedMonth} onValueChange={setSelectedMonth}>
							{/* Trigger: 這是使用者看到的按鈕外觀 */}
							<SelectTrigger className="w-auto min-w-[140px] h-10 bg-slate-800/80 border-slate-700 text-slate-200 rounded-full px-4 hover:bg-slate-700 hover:text-white transition-colors focus:ring-0 focus:ring-offset-0">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 opacity-70" />
									<SelectValue placeholder="選擇月份" />
								</div>
							</SelectTrigger>

							{/* Content: 這是點開後的直列式選單 */}
							<SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
								<SelectItem value="all" className="focus:bg-slate-700 focus:text-white cursor-pointer">
									📅 全部紀錄
								</SelectItem>
								{availableMonths.map((month) => (
									<SelectItem key={month} value={month} className="focus:bg-slate-700 focus:text-white cursor-pointer">
										{formatMonthOption(month)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 結餘與新增按鈕 */}
					<div className="flex items-end justify-between mb-10 relative z-10">
						<div>
							<div className="text-slate-400 text-sm mb-2 font-medium">{selectedMonth === "all" ? "總資產結餘" : `${formatMonthOption(selectedMonth)} 結餘`}</div>
							<div className={`text-6xl font-bold tracking-tight drop-shadow-sm font-mono ${balance >= 0 ? "text-green-400" : "text-red-500"}`}>$ {balance.toLocaleString()}</div>
						</div>

						<Button onClick={() => setIsDialogOpen(true)} className="bg-white text-slate-900 hover:bg-slate-200 font-bold px-6 py-6 rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
							<div className="bg-slate-900 rounded-full p-1">
								<Plus className="h-4 w-4 text-white" />
							</div>
							新增紀錄
						</Button>
					</div>

					{/* 收支資訊 */}
					<div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
						<div className="bg-slate-800/50 rounded-2xl p-5 backdrop-blur-md border border-slate-700/50 flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
							<div>
								<div className="flex items-center gap-2 mb-1">
									<span className="text-xs text-slate-400">收入</span>
									<TrendingUp className="h-3 w-3 text-emerald-400" />
								</div>
								<div className="text-2xl font-bold text-white tracking-wide">$ {totalIncome.toLocaleString()}</div>
							</div>
							<div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
								<span className="text-xl">💰</span>
							</div>
						</div>

						<div className="bg-slate-800/50 rounded-2xl p-5 backdrop-blur-md border border-slate-700/50 flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
							<div>
								<div className="flex items-center gap-2 mb-1">
									<span className="text-xs text-slate-400">支出</span>
									<TrendingDown className="h-3 w-3 text-rose-400" />
								</div>
								<div className="text-2xl font-bold text-white tracking-wide">$ {totalExpense.toLocaleString()}</div>
							</div>
							<div className="h-10 w-10 bg-rose-500/10 rounded-full flex items-center justify-center">
								<span className="text-xl">💸</span>
							</div>
						</div>
					</div>

					{/* 分頁按鈕 */}
					<div className="grid grid-cols-3 gap-4 relative z-10 bg-slate-950/40 p-2 rounded-2xl border border-slate-800">
						<button
							onClick={() => setActiveTab("details")}
							className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 font-bold text-sm
                ${activeTab === "details" ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
						>
							<List className="h-4 w-4" /> 明細列表
						</button>
						<button
							onClick={() => setActiveTab("chart")}
							className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 font-bold text-sm
                ${activeTab === "chart" ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
						>
							<PieChart className="h-4 w-4" /> 統計圖表
						</button>
						<button
							onClick={() => setActiveTab("report")}
							className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 font-bold text-sm
                ${activeTab === "report" ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
						>
							<FileText className="h-4 w-4" /> 財務報告
						</button>
					</div>
				</div>

				{/* --- 下方內容區 --- */}
				<div className="space-y-6 pb-20">
					{activeTab === "details" &&
						(sortedDates.length > 0 ? (
							sortedDates.map((date) => (
								<div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
									<h3 className="text-slate-500 font-bold mb-3 pl-2 flex items-center gap-2 text-sm uppercase tracking-wider">{formatDateDisplay(date)}</h3>
									<Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
										<CardContent className="p-0">
											{groupedTransactions[date].map((item, index) => (
												<div key={item.id} className={`flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer group ${index !== groupedTransactions[date].length - 1 ? "border-b border-slate-100" : ""}`}>
													<div className="flex items-center gap-6">
														<div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-200 shadow-sm">{item.emoji}</div>
														<div className="flex flex-col gap-1.5">
															<span className="font-bold text-slate-800 text-xl">{item.category}</span>
															<span className="text-base text-slate-400 font-medium">{item.note}</span>
														</div>
													</div>
													<span className={`text-2xl font-bold tracking-tight font-mono ${item.type === "expense" ? "text-slate-900" : "text-emerald-500"}`}>
														{item.type === "expense" ? "-" : "+"} ${item.amount}
													</span>
												</div>
											))}
										</CardContent>
									</Card>
								</div>
							))
						) : (
							// 如果該月份沒有資料顯示這個
							<div className="text-center py-20 text-slate-400">
								<p>📭 這個月份沒有記帳紀錄</p>
							</div>
						))}

					{/* 圖表分頁內容 */}
					{activeTab === "chart" && (
						<div className="animate-in fade-in zoom-in-95 duration-500">
							{/* 傳入 "篩選後" 的資料，這樣圖表也會跟著月份變動！ */}
							<ExpenseChart data={filteredTransactions} />
						</div>
					)}
					{/* --- 財務報告區塊 --- */}
					{activeTab === "report" && (
						<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
							{/* 1. Label 標題 */}
							<h3 className="text-slate-500 font-bold pl-2 flex items-center gap-2 text-sm uppercase tracking-wider">
								<FileText className="h-4 w-4" /> 智能財務分析報告
							</h3>

							{/* 2. 大背景 (Card) */}
							<Card className="min-h-[500px] bg-white shadow-sm rounded-3xl border-none">
								<CardContent className="p-8">
									{/* 3. 文字顯示區 
                      whitespace-pre-wrap: 讓後端的換行符號 (\n) 能正常顯示
                      leading-relaxed: 增加行高，讓長篇文章好閱讀
                   */}
									<div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base font-medium">
										{/* 這裡放入後端變數，目前先留白或顯示等待訊息 */}
										{/* reportData || "等待分析資料生成..." */}

										{/* 範例假字 (讓你看看效果，之後刪除即可) */}
										{"目前尚無分析報告。\n\n當後端串接完成後，這裡會顯示 AI 對於您本月支出的建議。例如：\n1. 餐飲支出過高，建議減少外食頻率。\n2. 娛樂開銷控制得宜。\n3. 結餘率為 20%，符合理財目標。"}
									</div>
								</CardContent>
							</Card>
							<h3 className="text-slate-500 font-bold pl-2 flex items-center gap-2 text-sm uppercase tracking-wider">
								<Bot className="h-4 w-4" /> 由 血藤瑞AI 快速分析(AI生成內容無法保證正確，請自行識別。)
							</h3>
						</div>
					)}

					{/* 浮動按鈕 */}
					<div className="fixed bottom-8 right-8 z-50">
						<Button onClick={() => setIsDialogOpen(true)} className="h-16 w-16 rounded-full bg-slate-900 shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all duration-200 flex items-center justify-center">
							<Plus className="h-8 w-8 text-white" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
