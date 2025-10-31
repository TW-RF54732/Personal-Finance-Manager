from FinanceDB import FinanceDB,Direction
myDB = FinanceDB("sqlite:///DB/finance.db",echo=False)
# myDB.add_category("我好費",Direction.Expenditure)
# myDB.add_category("沒心沒費",Direction.Expenditure)
print(myDB.get_category_by_type(Direction.Expenditure))
# myDB.add_category("伙食費",type=CategoryType.Expenditure)