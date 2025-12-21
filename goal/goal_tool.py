import json
import os
from datetime import datetime
from dataBase.FinanceDB import Direction , FinanceService

REQUIRED_KEYS = {"income", "expenditure", "total_save"}

def read_goal_data(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"{path}不存在")
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not REQUIRED_KEYS.issubset(data.keys()):
        missing = REQUIRED_KEYS - data.keys()
        raise ValueError(f"資料缺少必要欄位: {missing}")

    income_val = data['income']
    expenditure_val = data['expenditure']
    total_save_val = data['total_save']

    return (income_val, expenditure_val, total_save_val)

def update_goal_data(path, goal_data:tuple):
    data = {}
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            print("檔案格式損毀或為空，將重置檔案內容。")
            data = {}

    data['income'] = goal_data[0]
    data['expenditure'] = goal_data[1]
    data['total_save'] = goal_data[2]

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print(f"資料寫入 (Income: {goal_data[0]}, Exp: {goal_data[1]}, Save: {goal_data[2]})")

def calculate_period_stats(service:FinanceService, start_date: datetime, end_date: datetime):
    logs = service.get_filtered_and_sorted_logs(
        start_date=start_date,
        end_date=end_date
    )

    actual_income = 0.0
    actual_expenditure = 0.0

    for log in logs:
        amount = log['amount']
        l_type = log['actual_type']

        if l_type == Direction.Income.value:
            actual_income += amount
        elif l_type == Direction.Expenditure.value:
            actual_expenditure += amount
    
    actual_save = actual_income - actual_expenditure

    return {
        "income": actual_income,
        "expenditure": actual_expenditure,
        "total_save": actual_save
    }

def generate_goal_report(service, goal_json_path, start_date: datetime, end_date: datetime):
    try:
        goal_inc, goal_exp, goal_save = read_goal_data(goal_json_path)
    except Exception as e:
        return {"error": f"讀取目標檔失敗: {e}"}

    actuals = calculate_period_stats(service, start_date, end_date)
    act_inc = actuals['income']
    act_exp = actuals['expenditure']
    act_save = actuals['total_save']

    def calc_metrics(actual, goal, is_expenditure=False):
        diff = actual - goal
        
        if is_expenditure:
            achieved = actual <= goal
            if goal == 0:
                percentage = 0.0
            else:
                percentage = ((goal - actual) / goal) * 100.0
        else:
            achieved = actual >= goal
            if goal == 0:
                percentage = 0.0 if actual == 0 else 100.0
            else:
                percentage = (actual / goal) * 100.0
            
        return {
            "goal": goal,
            "actual": actual,
            "achieved": achieved,      
            "diff": diff,              
            "percentage": round(percentage, 2)
        }

    report = {
        "period": {
            "start": start_date.strftime("%Y-%m-%d"),
            "end": end_date.strftime("%Y-%m-%d")
        },
        "details": {
            "income": calc_metrics(act_inc, goal_inc, is_expenditure=False),
            "expenditure": calc_metrics(act_exp, goal_exp, is_expenditure=True),
            "total_save": calc_metrics(act_save, goal_save, is_expenditure=False)
        }
    }

    return report