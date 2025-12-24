from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
from typing import Tuple

# 引用工具與配置
from goal.goal_tool import update_goal_data, read_goal_data, generate_goal_report
from data.config import goul_path
from dataBase.FinanceDB import FinanceService

# 定義 Service 依賴樁 (Stub)
def get_service():
    raise NotImplementedError("Service not injected via dependency_overrides")

router = APIRouter()

# --- Pydantic Models ---
class GoalConfig(BaseModel):
    income: float
    expenditure: float
    total_save: float

# --- Endpoints ---

@router.get("/", response_model=GoalConfig)
async def get_goal_settings():
    """讀取目前的目標設定"""
    try:
        # read_goal_data 回傳 tuple (income, exp, save)
        data = read_goal_data(goul_path)
        return GoalConfig(
            income=data[0],
            expenditure=data[1],
            total_save=data[2]
        )
    except FileNotFoundError:
        # 若檔案不存在，回傳預設值 0
        return GoalConfig(income=0, expenditure=0, total_save=0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/")
async def update_goal_settings(goal: GoalConfig):
    """更新目標設定"""
    try:
        # 轉換為 tool 需要的 tuple 格式
        goal_tuple = (goal.income, goal.expenditure, goal.total_save)
        update_goal_data(goul_path, goal_tuple)
        return {"status": "success", "data": goal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report")
async def get_goal_achievement_report(
    start_date: datetime = Query(..., description="開始日期 (YYYY-MM-DD)"),
    end_date: datetime = Query(..., description="結束日期 (YYYY-MM-DD)"),
    service: FinanceService = Depends(get_service)
):
    """
    產生目標達成率報表
    需要依賴注入 FinanceService 來查詢實際帳務
    """
    try:
        report = generate_goal_report(service, goul_path, start_date, end_date)
        
        if "error" in report:
            raise HTTPException(status_code=400, detail=report["error"])
            
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))