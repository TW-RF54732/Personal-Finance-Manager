from dataBase.FinanceDB import FinanceDB, FinanceService, Direction, SortField
from datetime import datetime, timedelta
import random

random.seed(0)

db = FinanceDB(db_url="sqlite:///DB/test.db", echo=False)
service = FinanceService(db)

def _format_row_value(key, v):
    if v is None:
        return ""
    if key == "amount":
        try:
            return f"{float(v):.2f}"
        except Exception:
            return str(v)
    return str(v)

def print_table(title: str, rows: list[dict], headers: list | None = None, limit: int | None = None):
    """左對齊表格輸出"""
    print(title)
    if not rows:
        print("(無記錄)\n")
        return
    data = rows if limit is None else rows[:limit]
    if headers is None:
        # 固定欄位顯示順序（若有）
        default_order = ["timestamp", "id", "category", "category_id", "actual_type", "amount", "note"]
        headers = [h for h in default_order if h in data[0].keys()] + [h for h in data[0].keys() if h not in default_order]
    # 計算欄寬
    widths = {}
    for h in headers:
        maxw = len(h)
        for r in data:
            s = _format_row_value(h, r.get(h))
            if len(s) > maxw:
                maxw = len(s)
        widths[h] = maxw
    # 建格式字串
    fmt = "  ".join(f"{{:<{widths[h]}}}" for h in headers)
    # 標頭
    print(fmt.format(*[h for h in headers]))
    # 分隔線
    print(fmt.format(*['-' * widths[h] for h in headers]))
    # 列
    for r in data:
        vals = [_format_row_value(h, r.get(h)) for h in headers]
        print(fmt.format(*vals))
    print()

# 建立類別
categories = {
    "Salary": Direction.Income,
    "Rent": Direction.Expenditure,
    "Food": Direction.Expenditure,
    "Transport": Direction.Expenditure,
    "Utilities": Direction.Expenditure,
    "Entertainment": Direction.Expenditure,
    "Groceries": Direction.Expenditure,
    "Stocks": Direction.Expenditure,
    "Dividends": Direction.Income,
}
for name, d in categories.items():
    try:
        service.add_category(name, d)
    except ValueError:
        pass

# 產生一個月（2025-10-01 ~ 2025-10-30）的模擬紀錄
start_date = datetime(2025, 10, 1)
all_created = []

# 固定項目：薪資、房租
all_created.append(service.add_log("Salary", 5000.00, actual_type=Direction.Income, actuall_time=start_date.replace(hour=9)))
all_created.append(service.add_log("Rent", 1200.00, actual_type=Direction.Expenditure, actuall_time=start_date.replace(hour=10)))

# 每日小額花費 + 每週採買 + 娛樂與交通
for i in range(30):
    day = start_date + timedelta(days=i)
    # 0-2 餐飲
    for _ in range(random.randint(0, 2)):
        amt = round(random.uniform(5, 30), 2)
        all_created.append(service.add_log("Food", amt, actual_type=Direction.Expenditure, actuall_time=day.replace(hour=random.randint(8,20))))
    # 0-1 交通
    if random.random() < 0.7:
        amt = round(random.uniform(2, 12), 2)
        all_created.append(service.add_log("Transport", amt, actual_type=Direction.Expenditure, actuall_time=day.replace(hour=random.randint(7,22))))
    # 每7天一次雜貨
    if i % 7 == 2:
        amt = round(random.uniform(40, 120), 2)
        all_created.append(service.add_log("Groceries", amt, actual_type=Direction.Expenditure, actuall_time=day.replace(hour=17)))
    # 娛樂偶發
    if random.random() < 0.15:
        amt = round(random.uniform(20, 80), 2)
        all_created.append(service.add_log("Entertainment", amt, actual_type=Direction.Expenditure, actuall_time=day.replace(hour=20)))

# Utilities 中旬繳費
all_created.append(service.add_log("Utilities", 220.00, actual_type=Direction.Expenditure, actuall_time=(start_date + timedelta(days=14)).replace(hour=12)))

# 股市小額交易：產生多筆買賣（買=支出、賣=收入）
trade_days = random.sample(range(1, 29), 6)
for d in sorted(trade_days):
    buy_day = start_date + timedelta(days=d)
    buy_amt = round(random.uniform(200, 1200), 2)
    buy_log = service.add_log("Stocks", buy_amt, actual_type=Direction.Expenditure, actuall_time=buy_day.replace(hour=11))
    all_created.append(buy_log)

    # 隨機隔天到多日後賣出
    sell_offset = random.randint(1, 7)
    sell_day = buy_day + timedelta(days=sell_offset)
    profit_rate = random.uniform(-0.03, 0.18)  # 可能虧損或小幅獲利
    sell_amt = round(buy_amt * (1 + profit_rate), 2)
    sell_log = service.add_log("Stocks", sell_amt, actual_type=Direction.Income, actuall_time=sell_day.replace(hour=15))
    all_created.append(sell_log)

# 股利收入
all_created.append(service.add_log("Dividends", 55.00, actual_type=Direction.Income, actuall_time=(start_date + timedelta(days=20)).replace(hour=9)))

# 查詢與排序示範
all_logs = service.get_filtered_and_sorted_logs()  # 不帶過濾，預設時間降序
print_table("所有日誌（最近在前）", all_logs)

print_table("最近 5 筆記錄（時間降序）", all_logs, limit=5)

top_expenses = service.get_filtered_and_sorted_logs(direction=Direction.Expenditure, sort_by=SortField.AMOUNT, reverse=True)
print_table("支出類別 - 依金額降序（前 5 筆）", top_expenses, limit=5)

stocks = service.get_filtered_and_sorted_logs(category_name="Stocks", sort_by=SortField.TIMESTAMP, reverse=False)
print_table("Stocks 類別紀錄（時間升序）", stocks)

# 日期範圍範例（10/10 ~ 10/20）
dr_start = datetime(2025,10,10)
dr_end = datetime(2025,10,20,23,59,59)
range_logs = service.get_filtered_and_sorted_logs(start_date=dr_start, end_date=dr_end)
print_table("10/10~10/20 的紀錄", range_logs)

# 大額交易範例（>=1000）
big_trades = service.get_filtered_and_sorted_logs(min_amount=1000, sort_by=SortField.AMOUNT, reverse=True)
print_table("金額 >= 1000 的交易（依金額降序）", big_trades)

# 依金額升序示範（前 5）
asc_by_amount = service.get_filtered_and_sorted_logs(sort_by=SortField.AMOUNT, reverse=False)
print_table("依金額升序（前5筆）", asc_by_amount, limit=5)

# 計算各方向總額（由 service 回傳的日誌計算）
totals = {}
for l in all_logs:
    key = l["actual_type"] or "Unknown"
    totals[key] = totals.get(key, 0) + (l["amount"] or 0)

# 將 totals 轉為表格顯示
totals_rows = [{"direction": k, "total": f"{v:.2f}"} for k, v in totals.items()]
print_table("各方向總額", totals_rows, headers=["direction", "total"])
service.close()
db.close()
