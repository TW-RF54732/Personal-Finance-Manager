[新手開發指引](https://github.com/TW-RF54732/Personal-Finance-Manager/blob/main/Dev_ReadMe.md)

# 安裝
## 環境要求
系統: windows11
python: 3.11.9
CPU: x86架構 8邏輯處理(如果低於，則需手動設定)
GPU: 無需求(如要使用，需要額外手動下載依賴)
RAM: 16 GB+(如低於，請開啟虛擬記憶體，並且這會導致效率降低)
> [!CAUTION]
> 本專案目前在使用`python 3.11.9` 其他版本可能會遇到問題
> `python 3.14.0`目前不可使用，如果硬要使用，需要手動編譯所需庫
## 下載專案
```
git clone https://github.com/TW-RF54732/Personal-Finance-Manager.git
cd Personal-Finance-Manager
```
## 創建虛擬環境
python 預設3.11.9:
```
python -m venv .venv #創建
.\.venv\Scripts\Activate.ps1 #啟動 
```
有python 3.11.9但預設非3.11.9:
```
py -3.11 -m venv .venv #啟動
.\.venv\Scripts\Activate.ps1 #啟動 
```
## 使用建議環境安裝
```
pip install -r .\requirements.txt
```
