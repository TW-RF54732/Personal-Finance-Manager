from FinanceDB import FinanceDB,FinanceService,Direction
from datetime import datetime

class FinanceApplication:
    """應用層：提供給使用者操作的介面，封裝 FinanceService 的功能    """
    def __init__(self, db_url="sqlite:///./DB/finance.db", echo=False):
        """初始化 FinanceApplication"""
        self.db = FinanceDB(db_url, echo)
        self.service = FinanceService(self.db)
        self.selected_log_ids = [int]

    def close(self):
        """關閉資料庫連接"""
        self.service.close()
    
    ## 選擇操作 ##
    def select_set(self, log_ids:list[int]):
        self.selected_log_ids = log_ids

    ## 類別操作 ##
    def add_category(self, name:str, direction:Direction):
        return self.service.add_category(name, direction)