from fastapi import APIRouter, Depends
from datetime import datetime
import gc  # 新增：用於強制回收記憶體

from dataBase.FinanceDB import FinanceDB, FinanceService
from LLM.analyis import FinanceAnalysisEngine
from LLM.advice import FinanceAdvisorLLM
from pydantic import BaseModel
from config.config import LLM_model_path
router = APIRouter()

class ReportRequest(BaseModel):
    start_date_time: datetime
    end_date_time: datetime

def get_service():
    """
    這是一個佔位符。
    真正的 service 會在 app.py 透過 app.dependency_overrides 注入。
    """
    raise NotImplementedError("Service not injected via dependency_overrides")

# 修改 1: 改為 POST 以支援 Request Body
@router.post("/get_analyze_report")
async def generate_analysis_report(  # 建議改名，get_users 容易混淆
    report_args: ReportRequest,
    service: FinanceService = Depends(get_service)
):
    # 1. 執行數據統計
    engine = FinanceAnalysisEngine(service)
    report = engine.get_structured_report(report_args.start_date_time, report_args.end_date_time)
    
    if report.get("status") == "no_data":
        # 修改 2: 回傳 JSON 給前端，而不是只 print 在後端
        return {"status": "error", "message": "目前沒有足夠的財務資料進行分析。"}

    # 2. 載入模型 (隨用隨載策略)
    # 建議：將路徑改為配置檔或常數，避免硬編碼
    model_path = LLM_model_path
    
    advice_content = ""
    try:
        advisor = FinanceAdvisorLLM(model_path=model_path)
        advice_content = advisor.generate_advice(report)
    finally:
        # 修改 3: 確保模型用完後立即釋放記憶體
        if 'advisor' in locals():
            del advisor
        gc.collect() # 強制執行垃圾回收

    return {
        "status": "success",
        "advice": advice_content
    }
    
# ... (原本的 import 與 ReportRequest class 保持不變)

@router.post("/get_report")
async def get_statistics_report(
    report_args: ReportRequest,
    service: FinanceService = Depends(get_service)
):
    """
    回傳財務統計數據 (JSON)
    """
    engine = FinanceAnalysisEngine(service)
    report = engine.get_structured_report(report_args.start_date_time, report_args.end_date_time)
    
    if report.get("status") == "no_data":
        return {
            "status": "warning", 
            "message": "該區間內沒有足夠的財務資料。"
        }

    return {
        "status": "success", 
        "data": report
    }