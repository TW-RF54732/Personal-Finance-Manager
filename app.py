from fastapi import FastAPI
from api import api_model_ex
from api import DataBaseAPI
from api import analyzer
from dataBase.FinanceDB import FinanceDB,FinanceService

db = FinanceDB(db_url="sqlite:///DB/test.db", echo=False)
service = FinanceService(db)

app = FastAPI()

app.dependency_overrides[DataBaseAPI.get_service] = lambda: service
app.dependency_overrides[analyzer.get_service] = lambda: service
app.include_router(api_model_ex.router,prefix='/api/test',tags=['Test'])
app.include_router(DataBaseAPI.router,prefix='/api/database',tags=['Aatabase API'])
app.include_router(analyzer.router,prefix='/api/analyze',tags=['Analyze'])

@app.get('/')
def index():
    return 'hello'

