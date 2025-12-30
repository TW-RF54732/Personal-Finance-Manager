

# Personal Finance Database - FinBase

這是一個結合 **FastAPI** 後端與 **Local LLM (本地大語言模型)** 的個人財務管理系統。
專案已容器化，整合 `llama-cpp-python` 與 `CUDA` 環境，支援 **自動化模型下載** 與 **GPU 加速**。

## 📋 系統架構

* **Backend**: FastAPI (Python 3.11)
* **Database**: SQLite / PostgreSQL (透過 SQLAlchemy)
* **AI Engine**: Llama-3-Taiwan-8B-Instruct (GGUF)
* **Infrastructure**: Docker & Docker Compose (NVIDIA Container Toolkit)

---

## 🚀 快速部署 (Docker 推薦)

此方法已包含自動化腳本，會自動建立資料夾並下載模型，**無需手動安裝 Python 環境**。

### 1. 下載專案

```powershell
git clone https://github.com/TW-RF54732/Personal-Finance-Manager.git
cd Personal-Finance-Manager

```

### 2. 啟動服務

#### ✅ 若您有 NVIDIA 顯卡 (RTX 3060/4090 等)

本專案預設為 GPU 模式，請直接執行：

```powershell
docker compose up --build

```

#### ⚠️ 若您是 Mac (M1/M2) 或 無顯卡用戶

請務必先修改 `docker-compose.yml`，否則啟動會失敗：

1. 將 `args: DEVICE: gpu` 改為 `DEVICE: cpu`。
2. **刪除或註解掉** 整個 `deploy:` 區塊 (包含 resources/reservations/devices)。

### 3. 等待初始化

首次啟動時，系統會自動執行以下動作（視網速約需 5-10 分鐘）：

1. 建立 `/data/DB` 與 `/data/models` 資料夾。
2. 從 HuggingFace 自動下載 **Llama-3-Taiwan-8B-Instruct.Q5_K_M.gguf** (約 5.8GB)。
3. 下載完成後，服務將自動啟動於 `http://localhost:8000`。

---

## ⚙️ 設定指南 (重要)

服務啟動後，請前往 Web UI 的 **Settings (設定)** 頁面，填入以下 **Docker 內部路徑** 以確保連線正確：

| 設定項目 | 值 (請直接複製) | 說明 |
| --- | --- | --- |
| **資料庫連線 (SQL URL)** | `sqlite:////app/data/DB/Finance.db` | 注意是 4 個斜線，代表根目錄 |
| **模型路徑 (Model Path)** | `/app/data/models/Llama-3-Taiwan-8B-Instruct.Q5_K_M.gguf` | 系統自動下載的路徑 |

> [!TIP]
> 修改後請務必點擊 **「儲存設定」** 並 **「重啟連線」**。

---

## 🛠️ 手動開發環境 (非 Docker)

若需在不使用 Docker 的情況下進行開發，請參考以下步驟。

### 前置需求

* Python 3.11.9
* Visual Studio C++ Build Tools (Windows 必備)
* CUDA Toolkit 12.x (若要使用 GPU)

### 安裝步驟

1. **建立虛擬環境**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

```


2. **安裝依賴 (CPU 預設)**
```powershell
pip install -r requirements.txt

```


3. **啟用 GPU 加速 (選用)**
需移除 CPU 版並重新安裝支援 CUDA 的 `llama-cpp-python`：
```powershell
pip uninstall llama-cpp-python -y
pip install llama-cpp-python==0.2.90 --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu121

```


4. **啟動服務**
```powershell
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

```



---

## 📝 常見問題

* **Q: 啟動時卡在 "Checking directories..." 或 "Downloading..."？**
* A: 這是正常的，初次執行正在下載 5.8GB 的模型檔案，請耐心等待。


* **Q: 顯示 `CUDA error` 或 `driver not found`？**
* A: 請確認宿主機已安裝 NVIDIA 驅動，且 Docker Desktop 已啟用 WSL2 GPU 支援。若無顯卡，請改用 CPU 模式。


* **Q: 資料存在哪裡？**
* A: 所有資料（資料庫、模型）皆透過 Volume 掛載於專案根目錄的 `./data` 資料夾，移除容器不會導致資料遺失。