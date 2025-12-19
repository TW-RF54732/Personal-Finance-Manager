from dataBase.FinanceDB import FinanceDB,FinanceService,Direction,SortField
from datetime import datetime
from testTool import print_table

db = FinanceDB(db_url="sqlite:///DB/test.db", echo=False)
service = FinanceService(db)
# print(service.get_filtered_and_sorted_logs())
print(service.get_filtered_and_sorted_logs(start_date=datetime(2025,10,1),end_date=datetime(2025,10,7)))