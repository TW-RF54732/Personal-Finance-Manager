from fastapi import APIRouter, Depends
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import gc  

from dataBase.FinanceDB import FinanceDB, FinanceService
from LLM.analyis import FinanceAnalysisEngine
from LLM.advice import FinanceAdvisorLLM
from data.config import settings
router = APIRouter()

class ReportRequest(BaseModel):
    start_date_time: datetime
    end_date_time: datetime
    system_prompt: Optional[str] = None

def get_service():
    """
    這是一個佔位符。
    真正的 service 會在 app.py 透過 app.dependency_overrides 注入。
    """
    raise NotImplementedError("Service not injected via dependency_overrides")

# 修改 1: 改為 POST 以支援 Request Body
@router.post("/get_analyze_report")
async def generate_analysis_report(
    report_args: ReportRequest,
    service: FinanceService = Depends(get_service),
):
    # 1. 執行數據統計
    engine = FinanceAnalysisEngine(service)
    report = engine.get_structured_report(report_args.start_date_time, report_args.end_date_time)
    
    if report.get("status") == "no_data":
        return {"status": "error", "message": "目前沒有足夠的財務資料進行分析。"}

    # --- 新增邏輯：決定 Prompt ---
    # 如果前端有傳入 system_prompt (且不是空字串)，就使用前端的；否則使用 default_system_prompt
    use_prompt = report_args.system_prompt if report_args.system_prompt else settings.default_system_prompt
    print(use_prompt)
    # 2. 載入模型 (隨用隨載策略)
    model_path = settings.LLM_model_path # 建議改為從 config 讀取
    
    advice_content = ""
    advisor = None # 先宣告變數，避免 try 區塊出錯導致 finally 找不到變數

    try:
        advisor = FinanceAdvisorLLM(model_path=model_path)
        # 這裡傳入剛剛決定好的 use_prompt
        advice_content = advisor.generate_advice(report, system_prompt=use_prompt)
    except Exception as e:
        return {"status": "error", "message": f"AI 模型執行失敗: {str(e)}"}
    finally:
        # 3. 確保模型用完後立即釋放記憶體
        if advisor:
            del advisor
        gc.collect() # 強制執行垃圾回收

    return {
        "status": "success",
        "advice": advice_content,
        "prompt_source": "custom" if report_args.system_prompt else "default"
    }

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