from fastapi import APIRouter
from dataBase.FinanceDB import FinanceDB,FinanceService,Direction,SortField
from datetime import datetime
router = APIRouter()

@router.get("/")
async def db_index():
    return {"message": 'This is data base api'}

