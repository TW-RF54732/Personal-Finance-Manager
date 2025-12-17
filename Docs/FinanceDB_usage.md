這是一份針對 `FinanceDB.py` 的技術文件與使用指南，採用 Markdown 格式，你可以直接複製到專案的 `README.md` 或開發文件中。

---

# FinanceDB 模組使用指南

此模組封裝了基於 SQLAlchemy 的財務資料庫功能，採用 **三層式架構 (Controller -> Service -> Data Access)** 設計。

## 1. 架構說明

* **Models (`Category`, `FinanceLog`)**: 定義資料庫資料表結構 (ORM)。
* **Data Layer (`FinanceDB`)**: 負責底層 CRUD 操作，直接操作 Session。
* **Logic Layer (`FinanceService`)**: 負責商業邏輯、資料驗證、錯誤處理及格式轉換 (ORM -> Dict)。**外部調用應主要透過此層。**

## 2. 環境依賴

需要安裝 SQLAlchemy：

```bash
pip install sqlalchemy

```

## 3. 快速上手 (Python Script)

以下是如何在腳本中直接呼叫 `FinanceService` 的範例。

### 3.1 初始化

```python
from dataBase.FinanceDB import FinanceDB, FinanceService, Direction, SortField

# 1. 初始化底層 DB (指定 SQLite 檔案路徑)
db = FinanceDB(db_url="sqlite:///my_finance.db", echo=False)

# 2. 初始化邏輯層 Service (注入 DB 實例)
service = FinanceService(db)

```

### 3.2 類別管理 (Category)

在記帳之前，必須先建立分類。

```python
# 新增分類
try:
    # 建立 "餐飲" 分類，預設為 "支出"
    food = service.add_category("Food", Direction.Expenditure)
    print(f"Created: {food}")
    
    # 建立 "薪水" 分類，預設為 "收入"
    salary = service.add_category("Salary", Direction.Income)
except ValueError as e:
    print(f"Error: {e}")

# 取得所有分類
categories = service.get_all_categories()
# Output: [{'id': 1, 'name': 'Food', 'default_type': 'Expenditure'}, ...]

```

### 3.3 記帳 (Logging)

使用 `add_log`，只需提供分類名稱，Service 會自動查找 ID。

```python
# 新增一筆支出 (使用分類預設方向)
service.add_log(
    category_name="Food", 
    amount=150, 
    note="Lunch at 7-11"
)

# 新增一筆收入 (指定金額與備註)
service.add_log(
    category_name="Salary", 
    amount=50000, 
    note="December Salary"
)

# 強制指定交易方向 (例如：退款導致的支出類別收入)
service.add_log(
    category_name="Food",
    amount=50,
    actual_type=Direction.Income, # 這裡覆蓋了 Food 預設的 Expenditure
    note="Refund for bad coffee"
)

```

### 3.4 查詢與篩選 (Filtering & Sorting)

使用 `get_filtered_and_sorted_logs` 進行強大的複合查詢。

```python
from datetime import datetime

# 範例：查詢所有金額 > 100 的支出，並依金額排序
logs = service.get_filtered_and_sorted_logs(
    direction=Direction.Expenditure,
    min_amount=100,
    sort_by=SortField.AMOUNT,
    reverse=True # 金額大到小
)

# 範例：查詢特定日期的關鍵字
logs = service.get_filtered_and_sorted_logs(
    start_date=datetime(2023, 1, 1),
    note_keyword="Lunch"
)

for log in logs:
    print(f"[{log['timestamp']}] {log['category']} - ${log['amount']}: {log['note']}")

```

### 3.5 統計

```python
# 取得目前總收入與總支出
stats = service.get_total_by_type()
print(stats)
# Output: {'Income': 50050.0, 'Expenditure': 150.0}

```

---

## 4. 類別與方法對照表

### `FinanceService` (主要操作對象)

| 方法 | 參數重點 | 回傳 | 用途 |
| --- | --- | --- | --- |
| `add_category` | `name`, `default_type` (Direction) | `dict` | 新增分類，名稱不可重複。 |
| `delete_category` | `name` | `bool` | 刪除分類 (會連帶刪除該分類下的所有紀錄)。 |
| `add_log` | `category_name`, `amount`, `note`, `actual_type` | `dict` | 新增記帳紀錄。 |
| `get_filtered_and_sorted_logs` | `min/max_amount`, `start/end_date`, `sort_by`, `limit` | `list[dict]` | 萬用查詢與排序接口。 |
| `get_total_by_type` | 無 | `dict` | 計算各方向 (Income/Expenditure) 總額。 |
| `update_log` | `log_id`, 及各可選欄位 | `dict` | 修改既有紀錄。 |

### `Direction` (列舉)

* `Direction.Income`: 收入
* `Direction.Expenditure`: 支出

### `SortField` (列舉)

* `SortField.TIMESTAMP`: 交易時間 (預設)
* `SortField.AMOUNT`: 金額
* `SortField.ID`: 建立順序
* `SortField.CATEGORY`: 分類 ID

