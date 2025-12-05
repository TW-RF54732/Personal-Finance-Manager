from fastapi import FastAPI
from api import api_model_ex, DataBaseAPI
app = FastAPI()

app.include_router(api_model_ex.router,prefix='/api/test',tags=['Test'])
app.include_router(DataBaseAPI.router,prefix='/api/db',tags=['dataBase'])

@app.get('/')
def index():
    return 'hello'