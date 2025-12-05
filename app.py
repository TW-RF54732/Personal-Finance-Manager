from fastapi import FastAPI
from api import api_model_ex
app = FastAPI()

app.include_router(api_model_ex.router,prefix='/test',tags=['Test'])

@app.get('/')
def index():
    return 'hello'