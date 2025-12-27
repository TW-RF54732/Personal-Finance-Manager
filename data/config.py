import json
import os
from typing import Any

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'settings.json')

class Settings:
    # 預設值
    _defaults = {
        "sql_url": "sqlite:///DB/test.db",
        "goul_path": "./data/goal.json",
        "LLM_model_path": r"請輸入gguf模型位置",
        "n_ctx": 0,
        "n_threads": 16,
        "default_system_prompt": """你是一位專業財務顧問，只提供高效、精確且不廢話的財務洞察。請只用繁體中文
[要求]
1. 找出一個最需要削減的支出類別。
2. 提供一個具體的儲蓄目標。
3. 語氣專業、極簡。""",
        "temperature": 0.1,
        "max_tokens": 800
    }

    def __init__(self):
        self._cache = {}
        self.load()

    def load(self):
        """載入設定，若檔案不存在則建立"""
        if not os.path.exists(SETTINGS_FILE):
            self.save(self._defaults)
            self._cache = self._defaults.copy()
        else:
            try:
                with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self._cache = {**self._defaults, **data} # 合併預設值防缺漏
            except Exception as e:
                print(f"[Config] 載入失敗: {e}，使用預設值")
                self._cache = self._defaults.copy()

    def save(self, updates: dict = None):
        """儲存設定"""
        if updates:
            self._cache.update(updates)
        
        try:
            with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self._cache, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"[Config] 存檔失敗: {e}")

    # --- 屬性存取器 (Properties) ---
    @property
    def sql_url(self) -> str: return self._cache.get("sql_url")
    
    @property
    def goul_path(self) -> str: return self._cache.get("goul_path")

    @property
    def LLM_model_path(self) -> str: return self._cache.get("LLM_model_path")

    @property
    def n_ctx(self) -> int: return int(self._cache.get("n_ctx"))

    @property
    def n_threads(self) -> int: return int(self._cache.get("n_threads"))

    @property
    def default_system_prompt(self) -> str: return self._cache.get("default_system_prompt")

    @property
    def temperature(self) -> float: return float(self._cache.get("temperature"))

    @property
    def max_tokens(self) -> int: return int(self._cache.get("max_tokens"))

# 初始化單例
settings = Settings()