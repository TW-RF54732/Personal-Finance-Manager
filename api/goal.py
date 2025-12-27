from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime

# 引用工具與配置
from goal.goal_tool import generate_goal_report
from data.config import settings
from dataBase.FinanceDB import FinanceService

# 定義 Service 依賴樁
def get_service():
    raise NotImplementedError("Service not injected via dependency_overrides")

router = APIRouter()

@router.get("/report")
async def get_goal_achievement_report(
    start_date: datetime = Query(..., description="開始日期 (YYYY-MM-DD)"),
    end_date: datetime = Query(..., description="結束日期 (YYYY-MM-DD)"),
    service: FinanceService = Depends(get_service)
):
    """
    產生目標達成率報表
    """
    try:
        # 這裡依然需要 settings.goul_path 來讀取目標以進行比對
        report = generate_goal_report(service, settings.goul_path, start_date, end_date)
        
        if "error" in report:
            raise HTTPException(status_code=400, detail=report["error"])
            
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))