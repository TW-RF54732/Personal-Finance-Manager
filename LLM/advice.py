import json
from llama_cpp import Llama

class FinanceAdvisorLLM:
    def __init__(self, model_path: str, n_threads: int = 8):
        """
        初始化 LLM
        :param model_path: GGUF 模型路徑
        :param n_threads: CPU 核心數
        """
        self.llm = Llama(
            model_path=model_path,
            n_ctx=4096,          # 報告摘要通常在 500-1000 tokens 以內
            n_threads=n_threads, # 建議設為實體核心數
            verbose=False
        )

    def generate_advice(self, analysis_report: dict) -> str:
        """
        根據分析報告生成建議
        """
        # 建立簡潔、指令導向的 Prompt
        prompt = self._build_prompt(analysis_report)
        
        response = self.llm.create_chat_completion(
            messages=[
                {"role": "system", "content": "你是一位專業財務顧問，只提供高效、精確且不廢話的財務洞察。請只用繁體中文"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # 保持一致性
            max_tokens=800
        )
        return response["choices"][0]["message"]["content"]

    def _build_prompt(self, report: dict) -> str:
        """
        格式化數據摘要為 Prompt
        """
        return f"""
        請針對以下財務分析報告提供 3 點具體改善建議。
        
        [財務核心指標]
        - 總收入: {report['metrics']['total_income']}
        - 總支出: {report['metrics']['total_expense']}
        - 儲蓄率: {report['metrics']['savings_rate']}
        
        [支出結構]
        {json.dumps(report['expenditure_structure'], ensure_ascii=False, indent=2)}
        
        [異常支出與行為]
        - 異常項目: {report['anomalies']}
        - 高頻消費分類: {report['consumption_behavior']['high_frequency_categories']}
        
        [要求]
        1. 找出一個最需要削減的支出類別。
        2. 提供一個具體的儲蓄目標。
        3. 語氣專業、極簡。
        """