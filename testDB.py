from FinanceDB import FinanceDB,FinanceService,Direction
from datetime import datetime
db = FinanceDB("sqlite:///./DB/finance.db")
service = FinanceService(db)

# service.add_category("餐飲費",Direction.Expenditure)
# service.add_category("Salary",Direction.Income)
print(service.add_log("餐飲費",117,None,"去漢堡王買了可樂大杯+辣薯球",datetime(1111, 10, 29,20,19,2)))