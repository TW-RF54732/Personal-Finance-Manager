from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from api import api_model_ex
from api import DataBaseAPI
from api import analyzer
from api import goal
from api import settings as api_settings

from dataBase.FinanceDB import FinanceDB,FinanceService
from data.config import settings 
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 開發時方便，生產環境建議改為 ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = FinanceDB(db_url=settings.sql_url, echo=False)
service = FinanceService(db)

DIST_DIR = os.path.join(os.path.dirname(__file__), "UI")

app.dependency_overrides[DataBaseAPI.get_service] = lambda: service
app.dependency_overrides[analyzer.get_service] = lambda: service
app.dependency_overrides[goal.get_service] = lambda: service

app.include_router(api_model_ex.router,prefix='/api/test',tags=['Test'])
app.include_router(DataBaseAPI.router,prefix='/api/database',tags=['Database API'])
app.include_router(analyzer.router,prefix='/api/analyze',tags=['Analyze'])
app.include_router(goal.router, prefix='/api/goal', tags=['Goal'])
app.include_router(api_settings.router, prefix='/api/settings', tags=['Settings'])

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if os.path.exists(os.path.join(DIST_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = os.path.join(DIST_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(os.path.join(DIST_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
