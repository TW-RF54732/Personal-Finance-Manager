from fastapi import APIRouter
from dataBase.FinanceDB import FinanceDB,FinanceService,Direction,SortField
from datetime import datetime
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
router = APIRouter()

db = FinanceDB('sqlite:///dataBase/DB/finance.db')
service = FinanceService(db)

class SearchRequest(BaseModel):
    category_name: Optional[str] = None
    direction: Optional[Direction] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    note_keyword: Optional[str] = None
    sort_by: SortField = SortField.TIMESTAMP
    reverse: bool = True
    limit: Optional[int] = None

@router.get("/")
async def db_index():
    return {"message": 'This is data base api'}

@router.get('/get/all_catogry')
def get_all_catogry():
    return service.get_all_categories()

@router.get("/get/log_by_id/{log_id}")
def get_log_by_id(log_id:int):
    return service.get_log_by_id(log_id=log_id)

@router.post("/get/filtered_and_sorted_logs")
def get_filt(req: SearchRequest)->list[dict]:
    params = req.model_dump()
    result = service.get_filtered_and_sorted_logs(**params)
    return result