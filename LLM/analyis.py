import pandas as pd
from datetime import datetime
from dataBase.FinanceDB import FinanceService, Direction,FinanceDB

class FinanceAnalysisEngine:
    def __init__(self, service: FinanceService):
        self.service = service

    def get_structured_report(self, start_date=None, end_date=None):
        """
        生成詳盡的財務統計報告摘要
        """
        # 1. 獲取原始數據
        raw_logs = self.service.get_filtered_and_sorted_logs(
            start_date=start_date, 
            end_date=end_date
        )
        
        if not raw_logs:
            return {"status": "no_data"}

        # 轉換為 DataFrame 進行高效運算
        df = pd.DataFrame(raw_logs)
        df['timestamp'] = pd.to_datetime(df['timestamp'] ,format='ISO8601')

        # 2. 核心指標計算
        income_df = df[df['actual_type'] == Direction.Income.value]
        expense_df = df[df['actual_type'] == Direction.Expenditure.value]

        total_income = income_df['amount'].sum()
        total_expense = expense_df['amount'].sum()
        net_savings = total_income - total_expense
        savings_rate = (net_savings / total_income) if total_income > 0 else 0

        # 3. 支出深度分析
        # A. 分類統計與佔比
        cat_summary = expense_df.groupby('category')['amount'].sum().sort_values(ascending=False)
        cat_analysis = [
            {
                "category": cat,
                "amount": amt,
                "percentage": f"{(amt / total_expense * 100):.1f}%"
            }
            for cat, amt in cat_summary.items()
        ]

        # B. 異常支出偵測 (單筆金額大於支出平均值 2 倍)
        avg_expense = expense_df['amount'].mean()
        anomalies = expense_df[expense_df['amount'] > avg_expense * 2][['category', 'amount', 'note']].to_dict('records')

        # C. 頻次分析 (找出最常消費的項目)
        frequency = expense_df['category'].value_counts().head(3).to_dict()

        # 4. 構建輸出結構 (供 LLM 使用)
        report = {
            "period": {
                "start": start_date.isoformat() if start_date else "Origin",
                "end": end_date.isoformat() if end_date else "Now"
            },
            "metrics": {
                "total_income": round(total_income, 2),
                "total_expense": round(total_expense, 2),
                "net_savings": round(net_savings, 2),
                "savings_rate": f"{savings_rate:.1%}"
            },
            "expenditure_structure": cat_analysis,
            "anomalies": anomalies,
            "consumption_behavior": {
                "high_frequency_categories": frequency,
                "average_transaction": round(avg_expense, 2)
            }
        }
        
        return report
    

