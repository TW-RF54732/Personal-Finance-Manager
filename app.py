from fastapi import FastAPI
from api import api_model_ex
from api import DataBaseAPI
from dataBase.FinanceDB import FinanceDB,FinanceService

db = FinanceDB(db_url="sqlite:///DB/test.db", echo=False)
service = FinanceService(db)

app = FastAPI()

app.dependency_overrides[DataBaseAPI.get_service] = lambda: service
app.include_router(api_model_ex.router,prefix='/test',tags=['Test'])
app.include_router(DataBaseAPI.router,prefix='/database',tags=['database'])

@app.get('/')
def index():
    return 'hello'

