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

為了方便開發者查閱，以下將 **`FinanceDB.py`** 中的資料層（`FinanceDB`）與邏輯層（`FinanceService`）的功能進行對照整理。


---

#### 1. 類別管理 (Category)

| 功能描述 | 資料層方法 (`FinanceDB`) | 邏輯層方法 (`FinanceService`) | 備註 |
| --- | --- | --- | --- |
| **新增類別** | `create_category` | `add_category` | 邏輯層會檢查名稱是否重複。 |
| **取得所有類別** | `get_all_categories` | `get_all_categories` | 依名稱排序回傳清單。 |
| **名稱查詢** | `get_category_by_name` | (由邏輯層內部私用) | 用於確認類別是否存在。 |
| **修改類別** | `update_category` | `update_category` | 支援修改名稱與預設收支方向。 |
| **刪除類別** | `delete_category_by_id` | `delete_category` | 邏輯層提供依名稱刪除的便利性。 |

---

#### 2. 財務日誌管理 (Log)

| 功能描述 | 資料層方法 (`FinanceDB`) | 邏輯層方法 (`FinanceService`) | 備註 |
| --- | --- | --- | --- |
| **新增日誌** | `create_log` | `add_log` | 若未提供方向，邏輯層會自動帶入類別預設值。 |
| **依 ID 查詢** | `get_log_by_id` | `get_log_by_id` | 邏輯層會轉換為 JSON 格式。 |
| **過濾與排序** | `get_logs_with_sorting` | `get_filtered_and_sorted_logs` | 支援金額區間、日期、關鍵字等多重過濾。 |
| **修改日誌** | `update_log` | `update_log` | 支援局部更新所有欄位。 |

---

#### 3. 基礎設施與轉換工具

| 功能描述 | 方法名稱 | 所屬類別 | 說明 |
| --- | --- | --- | --- |
| **資料庫連線** | `__init__` | `FinanceDB` | 初始化 SQLite 連線並建立資料表。 |
| **關閉連線** | `close` | 兩者皆有 | 釋放資料庫資源。 |
| **格式轉換** | `_log_to_dict` | `FinanceService` | 將 ORM 物件格式化為含 ISO 時間字串的字典。 |

---

### 💡 開發重點摘要

* **資料一致性**：`FinanceDB` 的方法均包含 `try...except` 區塊與 `session.rollback()`，確保操作失敗時不會汙染資料庫。
* **排序欄位 (`SortField`)**：系統支援依據 `TIMESTAMP`、`AMOUNT`、`ID`、`CATEGORY` 或 `DIRECTION` 進行排序。
* **收支定義 (`Direction`)**：固定為 `Income` (收入) 或 `Expenditure` (支出)。

需要我為您示範如何直接呼叫 `FinanceService` 進行一筆複雜的條件過濾查詢嗎？

### `Direction` (列舉)

* `Direction.Income`: 收入
* `Direction.Expenditure`: 支出

### `SortField` (列舉)

* `SortField.TIMESTAMP`: 交易時間 (預設)
* `SortField.AMOUNT`: 金額
* `SortField.ID`: 建立順序
* `SortField.CATEGORY`: 分類 ID

