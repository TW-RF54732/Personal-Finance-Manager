sql_url = 'sqlite:///DB/test.db' #資料庫URL
goul_path = './data/goal.json'


"""
大語言模型設定
"""
LLM_model_path = r""
n_ctx = int(0) #報告摘要通常在 500-1000 tokens 以內, 0 為自動使用模型最大上下文
n_threads = int(8) #CPU 核心數

system_prompt = "你是一位專業財務顧問，只提供高效、精確且不廢話的財務洞察。請只用繁體中文"

temperature = 0.1 #0-1 數字越大越回答隨機
max_tokens = 800