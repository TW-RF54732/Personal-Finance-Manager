# 下載與安裝
下載專案並安裝依賴
> 你需要有git以及python
```
git clone https://github.com/TW-RF54732/Personal-Finance-Manager.git #下載repo
cd Personal-Finance-Manager #進入資料夾
python -m venv .venv #創建虛擬環境
.\.venv\Scripts\Activate.ps1 #啟動虛擬環境
mkdir DB
pip install -r .\requirments.txt #安裝所需依賴
```

# git
不同功能部分請使用不同branch
## 初次使用
你沒有以創建的branch
```
git branch 你的命名 #創建分支
git switch 你的命名 #切換到分支
```
## 功能完成
當你認為你的部分已經完成，把你的分支融入主分支
```
git checkout main #回到主分支
git merge 你的命名 #把你的分支融合到主分支
```
# 目前功能簡介
## 記帳資料庫 FinanceDB.py
位於`Personal-Finance-Manager/dataBase`中   
[FinanceDB說明書](https://github.com/TW-RF54732/Personal-Finance-Manager/blob/main/Docs/FinanceDB_usage.md) `FinanceDB_usage.md`位於`Personal-Finance-Manager/Docs`中
## 後端
### 啟動
```
uvicorn app:app --reload
```
### 查看api格式文黨
**在啟動後端後** 打開`/docs`路由   
預設開啟
```
http://127.0.0.1:8000/docs
```
