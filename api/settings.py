from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Tuple
from data.config import settings  # 匯入單例物件
from goal.goal_tool import read_goal_data, update_goal_data # 匯入工具

router = APIRouter()

# --- System Settings Models ---
class SettingsUpdate(BaseModel):
    sql_url: Optional[str] = None
    LLM_model_path: Optional[str] = None
    default_system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    n_ctx: Optional[int] = None
    n_threads: Optional[int] = None

# --- Goal Settings Models ---
class GoalConfig(BaseModel):
    income: float
    expenditure: float
    total_save: float

# ==========================================
# System Configuration Endpoints
# ==========================================

@router.get("/system")
async def get_system_settings():
    """取得系統參數 (settings.json)"""
    return settings._cache

@router.put("/system")
async def update_system_settings(new_settings: SettingsUpdate):
    """更新系統參數"""
    updates = new_settings.dict(exclude_unset=True)
    if not updates:
        return {"status": "no_change"}

    try:
        settings.save(updates)
        return {"status": "success", "updated": updates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goal", response_model=GoalConfig)
async def get_goal_settings():
    """讀取財務目標設定 (goal.json)"""
    try:
        # 使用 settings.goul_path 取得路徑
        data = read_goal_data(settings.goul_path)
        return GoalConfig(
            income=data[0],
            expenditure=data[1],
            total_save=data[2]
        )
    except FileNotFoundError:
        return GoalConfig(income=0, expenditure=0, total_save=0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/goal")
async def update_goal_settings(goal: GoalConfig):
    """更新財務目標設定"""
    try:
        goal_tuple = (goal.income, goal.expenditure, goal.total_save)
        update_goal_data(settings.goul_path, goal_tuple)
        return {"status": "success", "data": goal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))