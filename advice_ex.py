from dataBase.FinanceDB import FinanceDB, FinanceService
from LLM.analyis import FinanceAnalysisEngine
from LLM.advice import FinanceAdvisorLLM

def main():
    # 1. 初始化資料庫與服務
    db = FinanceDB("sqlite:///DB/test.db")
    service = FinanceService(db)
    
    # 2. 執行「純分析」模組
    engine = FinanceAnalysisEngine(service)
    report = engine.get_structured_report() # 獲取統計後的摘要
    
    if report.get("status") == "no_data":
        print("目前沒有足夠的財務資料進行分析。")
        return

    # 3. 執行「LLM 推理」模組
    # 請確保已下載 Qwen2.5-7B-Instruct-Q4_K_M.gguf
    advisor = FinanceAdvisorLLM(model_path=r"D:\Projects\copySoul\copySoul\core\llm\models\L3-8B-Stheno-v3.2-Q5_K_S.gguf")
    advice = advisor.generate_advice(report)
    
    # 4. 輸出結果
    print("=== 財務分析報告摘要 ===")
    print(f"儲蓄率: {report['metrics']['savings_rate']}")
    print("\n=== AI 專家建議 ===")
    print(advice)

if __name__ == "__main__":
    main()