from fastapi import FastAPI

from api import api_model_ex
from api import DataBaseAPI
from api import analyzer
from api import goal

from dataBase.FinanceDB import FinanceDB,FinanceService
from data.config import sql_url
# 在你的 app.py 中加入
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 開發時方便，生產環境建議改為 ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = FinanceDB(db_url=sql_url, echo=False)
service = FinanceService(db)


app.dependency_overrides[DataBaseAPI.get_service] = lambda: service
app.dependency_overrides[analyzer.get_service] = lambda: service
app.dependency_overrides[goal.get_service] = lambda: service

app.include_router(api_model_ex.router,prefix='/api/test',tags=['Test'])
app.include_router(DataBaseAPI.router,prefix='/api/database',tags=['Database API'])
app.include_router(analyzer.router,prefix='/api/analyze',tags=['Analyze'])
app.include_router(goal.router, prefix='/api/goal', tags=['Goal'])

@app.get('/')
def index():
    return 'hello'

