from FinanceDB import FinanceDB,FinanceService,Direction,SortField
from datetime import datetime
from testTool import print_table
db = FinanceDB(db_url="sqlite:///DB/test.db", echo=False)
service = FinanceService(db)


# print(print_table("所有類別",service.get_all_categories()))
"""所有類別
id  name           default_type
--  -------------  ------------
9   Dividends      Income
6   Entertainment  Expenditure
3   Food           Expenditure
7   Groceries      Expenditure
2   Rent           Expenditure
1   Salary         Income
8   Stocks         Expenditure
4   Transport      Expenditure
5   Utilities      Expenditure
"""

# print(service.get_filtered_and_sorted_logs("Stocks",direction=Direction.Income)[1]["amount"])
# stock_totals = sum(item["amount"] for item in service.get_filtered_and_sorted_logs("Stocks",direction=Direction.Income))-sum(item["amount"] for item in service.get_filtered_and_sorted_logs("Stocks",direction=Direction.Expenditure))
# print(stock_totals)

print_table("  ",service.get_filtered_and_sorted_logs(sort_by=SortField.DIRECTION),["category","id","amount"])