import { useState, useMemo, useEffect } from "react"; // 1. 確保引入 useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, PieChart, FileText, List, TrendingUp, TrendingDown, Calendar } from "lucide-react";
// 請確認你的檔案路徑是否正確，如果不對請自行修改
import { AddTransactionDialog } from "@/components/ui/NewTransactionDialog";
import { ExpenseChart } from "@/components/ui/ExpenseChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 2. 引入 API 函式 (請確認你有建立 src/lib/api.ts)
import { fetchTransactions, createTransaction, fetchAiReport } from "@/lib/api";

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

// 假資料 (留著備用，或測試用)
const mockData: Transaction[] = [
	{ id: 1, date: "2025-11-04", type: "expense", amount: 120, category: "餐飲", emoji: "🍜", note: "午餐牛肉麵" },
	{ id: 2, date: "2025-11-04", type: "expense", amount: 45, category: "飲料", emoji: "🥤", note: "珍奶微糖" },
];

function Dashboard() {
	// 3. 初始狀態改成空陣列 []，等待後端資料載入
	const [transactions, setTransactions] = useState<Transaction[]>([]);

	const [selectedMonth, setSelectedMonth] = useState<string>("all");
	const [activeTab, setActiveTab] = useState<"details" | "chart" | "report">("details");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isReportLoading, setIsReportLoading] = useState(false);
	const [reportText, setReportText] = useState("");

	// --- 副作用區 (Effects) ---

	// Effect 1: 畫面載入時，抓取所有記帳資料
	useEffect(() => {
		const loadData = async () => {
			try {
				const data = await fetchTransactions();

				// --- 修正重點開始 ---
				// 我們要把 API 回傳的資料 (id 可能是 undefined)
				// 轉換成 Dashboard 需要的格式 (id 必須是 number)
				const validData: Transaction[] = data.map((item) => ({
					...item,
					// 如果後端沒回傳 ID (理論上不會發生)，就給它一個隨機亂數或是 0，避免報錯
					id: item.id ?? Date.now() + Math.random(),
				}));

				setTransactions(validData);
				// --- 修正重點結束 ---
			} catch (error) {
				console.error("無法載入資料:", error);
			}
		};
		loadData();
	}, []);

	// Effect 2: 切換到 Report 分頁時，抓取 AI 報告
	useEffect(() => {
		if (activeTab === "report" && !reportText && !isReportLoading) {
			setIsReportLoading(true);
			fetchAiReport()
				.then((text) => {
					setReportText(text);
				})
				.catch((err) => {
					console.error(err);
					setReportText("AI 分析連線逾時或發生錯誤，請稍後再試。");
				})
				.finally(() => {
					setIsReportLoading(false);
				});
		}
	}, [activeTab]);

	// --- 邏輯處理區 ---

	// 邏輯 A: 自動計算出資料裡有哪些月份
	const availableMonths = useMemo(() => {
		const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
		return Array.from(months).sort((a, b) => b.localeCompare(a));
	}, [transactions]);

	// 邏輯 B: 根據選擇的月份篩選資料
	const filteredTransactions = useMemo(() => {
		if (selectedMonth === "all") return transactions;
		return transactions.filter((t) => t.date.startsWith(selectedMonth));
	}, [transactions, selectedMonth]);

	// 邏輯 C: 統計數據
	const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((acc, curr) => acc + curr.amount, 0);
	const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((acc, curr) => acc + curr.amount, 0);
	const balance = totalIncome - totalExpense;

	// 邏輯 D: 資料分組
	const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
		const date = transaction.date;
		if (!groups[date]) groups[date] = [];
		groups[date].push(transaction);
		return groups;
	}, {} as Record<string, Transaction[]>);

	const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

	// 日期顯示格式化
	const formatDateDisplay = (dateString: string) => {
		const date = new Date(dateString);
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const weekDay = date.toLocaleDateString("zh-TW", { weekday: "short" });
		return `${month}月${day}日 ${weekDay}`;
	};

	const formatMonthOption = (ym: string) => {
		const [y, m] = ym.split("-");
		return `${y}年 ${m}月`;
	};

	// 4. 修改儲存邏輯：串接 API
	const handleSaveTransaction = async (newData: any) => {
		try {
			// 呼叫後端 API
			const savedData = await createTransaction(newData);

			// 更新前端畫面 (將新資料加到最前面)
			// 如果後端沒有回傳完整物件，這裡可以用 ...newData 補上 id
			setTransactions([savedData, ...transactions]);

			// 成功提示 (可選)
			// alert("新增成功！");
		} catch (error) {
			console.error("新增失敗:", error);
			alert("無法儲存紀錄，請檢查後端連線。");
		}
	};

	return (
		<div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
			{/* 彈出視窗 */}
			<AddTransactionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSaveTransaction} />

			<div className="w-full lg:w-1/2 max-w-4xl space-y-6">
				{/* --- 頂部核心區塊 --- */}
				<div className="bg-slate-900 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
					<div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-800 rounded-full opacity-40 blur-3xl"></div>

					{/* 月份選擇 Select */}
					<div className="flex justify-start mb-8 relative z-10">
						<Select value={selectedMonth} onValueChange={setSelectedMonth}>
							<SelectTrigger className="w-auto min-w-[140px] h-10 bg-slate-800/80 border-slate-700 text-slate-200 rounded-full px-4 hover:bg-slate-700 hover:text-white transition-colors focus:ring-0 focus:ring-offset-0">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 opacity-70" />
									<SelectValue placeholder="選擇月份" />
								</div>
							</SelectTrigger>
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
					{/* 1. 明細列表 */}
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
							// 空狀態
							<div className="text-center py-20 text-slate-400">
								<p>📭 這個月份沒有記帳紀錄</p>
							</div>
						))}

					{/* 2. 圖表分頁 */}
					{activeTab === "chart" && (
						<div className="animate-in fade-in zoom-in-95 duration-500">
							<ExpenseChart data={filteredTransactions} />
						</div>
					)}

					{/* 3. 財務報告分頁 */}
					{activeTab === "report" && (
						<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
							<h3 className="text-slate-500 font-bold pl-2 flex items-center gap-2 text-sm uppercase tracking-wider">
								<FileText className="h-4 w-4" /> 智能財務分析報告
							</h3>

							<Card className="min-h-[500px] bg-white shadow-sm rounded-3xl border-none relative overflow-hidden">
								<CardContent className="p-8 h-full">
									{isReportLoading ? (
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 space-y-4">
											<div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
											<p className="text-slate-500 font-medium animate-pulse">AI 正在分析您的財務狀況...</p>
											<p className="text-xs text-slate-400">(這可能需要 10-30 秒)</p>
										</div>
									) : (
										<div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base font-medium">{reportText || "目前尚無資料可供分析，請先新增幾筆記帳紀錄。"}</div>
									)}
								</CardContent>
							</Card>
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
