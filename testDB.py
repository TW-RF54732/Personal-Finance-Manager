from sqlManager import FinanceDB,CategoryType

myDB = FinanceDB()
# myDB.add_category("伙食費",type=CategoryType.Expenditure)
# myDB.add_category("我好費",type=CategoryType.Expenditure)
# myDB.add_category("沒心沒費",type=CategoryType.Expenditure)

# myDB.add_category("生活費",type=CategoryType.Income)
# myDB.add_category("路邊撿到錢",type=CategoryType.Income)
# myDB.add_category("乞討費",type=CategoryType.Income)

print(myDB.get_category_by_type(CategoryType.Expenditure))