sql_url = 'sqlite:///DB/test.db' #資料庫URL
goul_path = './data/goal.json'


"""
大語言模型設定
"""
LLM_model_path = r"D:\Projects\copySoul\copySoul\core\llm\models\L3-8B-Stheno-v3.2-Q5_K_S.gguf"
n_ctx = int(0) #報告摘要通常在 500-1000 tokens 以內, 0 為自動使用模型最大上下文
n_threads = int(8) #CPU 核心數

default_system_prompt = """
你是一位專業財務顧問，只提供高效、精確且不廢話的財務洞察。請只用繁體中文
[要求]
1. 找出一個最需要削減的支出類別。
2. 提供一個具體的儲蓄目標。
3. 語氣專業、極簡。

"""

temperature = 0.1 #0-1 數字越大越回答隨機
max_tokens = 800