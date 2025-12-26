from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from dataBase.FinanceDB import FinanceService, Direction, SortField

# --- 1. Pydantic Models (資料驗證模型) ---

# 類別相關模型
class CategoryCreate(BaseModel):
    name: str
    default_direction: Direction

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    default_direction: Optional[Direction] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    default_type: str 

# 日誌相關模型
class LogCreate(BaseModel):
    category_name: str
    # 修改：加入 gt=0 (greater than 0)，若傳入字串 Pydantic 會自動擋下回傳 422
    amount: float = Field(..., gt=0, description="金額必須為大於 0 的數字") 
    actual_type: Optional[Direction] = None
    note: Optional[str] = None
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

class LogUpdate(BaseModel):
    category_name: Optional[str] = None
    actual_type: Optional[Direction] = None
    # 修改：加入 gt=0
    amount: Optional[float] = Field(None, gt=0, description="金額必須為大於 0 的數字")
    note: Optional[str] = None
    timestamp: Optional[datetime] = None

# --- 2. Dependency Injection Stub ---
def get_service():
    """
    這是一個佔位符。
    真正的 service 會在 app.py 透過 app.dependency_overrides 注入。
    """
    raise NotImplementedError("Service not injected via dependency_overrides")

# --- 3. Router 定義 ---
router = APIRouter()

@router.get("/")
async def db_index():
    return {"message": 'Finance Database API is running'}

# ==========================================
# Category Endpoints (類別管理)
# ==========================================

@router.get("/categories", response_model=List[CategoryResponse])
async def get_all_categories(service: FinanceService = Depends(get_service)):
    """取得所有類別"""
    return service.get_all_categories()

@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate, 
    service: FinanceService = Depends(get_service)
):
    """新增類別"""
    try:
        result = service.add_category(category.name, category.default_direction)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/categories/{category_id}")
async def update_category(
    category_id: int, 
    category: CategoryUpdate, 
    service: FinanceService = Depends(get_service)
):
    """修改類別"""
    try:
        result = service.update_category(
            category_id, 
            name=category.name, 
            default_type=category.default_direction
        )
        if not result:
            raise HTTPException(status_code=404, detail="Category not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/categories/{name}")
async def delete_category(
    name: str, 
    service: FinanceService = Depends(get_service)
):
    """刪除類別 (依名稱)"""
    success = service.delete_category(name)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found or delete failed")
    return {"status": "success", "message": f"Category '{name}' deleted"}

# ==========================================
# Log Endpoints (日誌管理)
# ==========================================

@router.post("/logs")
async def create_log(
    log: LogCreate, 
    service: FinanceService = Depends(get_service)
):
    """新增財務日誌"""
    try:
        result = service.add_log(
            category_name=log.category_name,
            amount=log.amount,
            actual_type=log.actual_type,
            note=log.note,
            actuall_time=log.timestamp 
        )
        return result
    except ValueError as e:
        # 捕捉 Service 層拋出的錯誤，回傳 400 給前端
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/logs/{log_id}")
async def delete_log(
    log_id: int,
    service: FinanceService = Depends(get_service)
):
    """刪除日誌"""
    try:
        success = service.delete_log(log_id)
        if not success:
            raise HTTPException(status_code=404, detail="Log not found")
        return {"status": "success", "message": f"Log {log_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/logs/{log_id}")
async def update_log(
    log_id: int, 
    log: LogUpdate, 
    service: FinanceService = Depends(get_service)
):
    """修改日誌"""
    try:
        result = service.update_log(
            log_id=log_id,
            category_name=log.category_name,
            actual_type=log.actual_type,
            amount=log.amount,
            note=log.note,
            timestamp=log.timestamp
        )
        if not result:
            raise HTTPException(status_code=404, detail="Log not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/logs")
async def get_filtered_logs(
    category_name: Optional[str] = None,
    direction: Optional[Direction] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    note_keyword: Optional[str] = None,
    sort_by: SortField = SortField.TIMESTAMP,
    reverse: bool = True,
    limit: Optional[int] = None,
    service: FinanceService = Depends(get_service)
):
    """
    取得過濾並排序後的日誌 (搜尋功能)
    Url 範例: /logs?min_amount=100&sort_by=amount&reverse=false
    """
    try:
        results = service.get_filtered_and_sorted_logs(
            category_name=category_name,
            direction=direction,
            min_amount=min_amount,
            max_amount=max_amount,
            start_date=start_date,
            end_date=end_date,
            note_keyword=note_keyword,
            sort_by=sort_by,
            reverse=reverse,
            limit=limit
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 