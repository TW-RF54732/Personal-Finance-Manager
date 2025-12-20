from dataBase.FinanceDB import FinanceDB, FinanceService, Direction
from datetime import datetime
import os

from goal.goal_tool import update_goal_data,generate_goal_report

# 1. 設定路徑與資料庫
json_path = r'./data/goal.json'
db_url = "sqlite:///DB/test.db"

# 確保目錄存在 (測試用)
os.makedirs(os.path.dirname(json_path), exist_ok=True)
if not os.path.exists(json_path):
    update_goal_data(json_path, (50000, 30000, 20000))
# 2. 初始化 Service
db = FinanceDB(db_url=db_url, echo=False)
service = FinanceService(db)
try:
    # 3. 建立一些測試資料 (如果資料庫是空的)
    # 為了測試，我們先加一筆收入和一筆支出
    try:
        service.add_category("薪水", Direction.Income)
        service.add_category("餐費", Direction.Expenditure)
    except:
        pass # 類別可能已存在
        
    # 模擬本月資料
    now = datetime.now()
    service.add_log("薪水", 55000, note="本月薪資", actuall_time=now) # 收入超標 (目標50000)
    service.add_log("餐費", 15000, note="聚餐", actuall_time=now)    # 支出達標 (目標30000)
    # 4. 生成報表
    # 設定時間範圍：本月第一天到現在
    start_of_month = datetime(now.year, now.month, 1)
    end_of_month = datetime(now.year, now.month, 28) # 簡單示意
    print("\n--- 生成報表 ---")
    report = generate_goal_report(service, json_path, start_of_month, now)
    
    # 5. 美化輸出結果
    details = report['details']
    
    print(f"統計區間: {report['period']['start']} ~ {report['period']['end']}\n")
    
    row_format = "{:<12} | {:<10} | {:<10} | {:<10} | {:<10} | {:<10}"
    print(row_format.format("項目", "目標", "實際", "達成?", "差異", "百分比"))
    print("-" * 75)
    
    for key, val in details.items():
        status = "✅ 達成" if val['achieved'] else "❌ 未達成"
        diff_str = f"{val['diff']:+.0f}" # 顯示正負號
        pct_str = f"{val['percentage']}%"
        
        print(row_format.format(
            key, 
            val['goal'], 
            val['actual'], 
            status, 
            diff_str, 
            pct_str
        ))
except Exception as e:
    print(f"發生錯誤: {e}")
finally:
    service.close()