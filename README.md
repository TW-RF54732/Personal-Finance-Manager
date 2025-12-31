# Personal Finance Database - FinBase

這是一個結合 **FastAPI** 後端與 **Local LLM (本地大語言模型)** 的個人財務管理系統。
專案已完全容器化，整合 `llama-cpp-python`，支援 **自動化模型下載** 與 **GPU (CUDA) 加速**。

## 📋 系統需求與前置準備

在開始之前，請確保您的環境滿足以下要求：

### 軟體環境

1. **Docker Desktop** (Windows/Mac) 或 **Docker Engine** (Linux)。
2. **Windows 用戶必備**：
* 啟用 **WSL 2** (Windows Subsystem for Linux)。
* Docker Desktop 設定中需勾選 "Use the WSL 2 based engine"。


3. **GPU 加速需求 (NVIDIA 顯卡用戶)**：
* 宿主機需安裝最新版 **NVIDIA Driver**。
* Windows 用戶：Docker Desktop 預設支援 WSL2 GPU 直通。
* Linux 用戶：需安裝 **NVIDIA Container Toolkit**。



### 硬體建議

* **RAM**: 至少 16GB (CPU 模式) 或 **VRAM**: 至少 6GB (GPU 模式)。
* **硬碟空間**: 至少預留 10GB (包含 Docker Image 與 LLM 模型檔)。

---

## 🚀 Docker 快速部署 (推薦)

### 1. 取得專案

```powershell
git clone https://github.com/TW-RF54732/Personal-Finance-Manager.git
cd Personal-Finance-Manager

```

### 2. 配置運行模式 (GPU vs CPU)

預設設定為 **GPU 模式**。請根據您的硬體修改 `docker-compose.yml`：

#### ✅ 方案 A：使用 NVIDIA GPU (建議)

* **適用**：RTX 3060, 4090 等 NVIDIA 顯卡。
* **設定**：保持預設即可，確認 `args` 為 `gpu` 且保留 `deploy` 區塊。

```yaml
services:
  finance-ai:
    build:
      args:
        DEVICE: gpu  # 啟用 CUDA 支援
    deploy:          # 保留此區塊以調用顯卡
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

```

#### ⚠️ 方案 B：使用 CPU (無顯卡/Mac 用戶)

* **適用**：Intel/AMD 內顯、Mac M1/M2/M3、無 NVIDIA 顯卡環境。
* **設定**：修改 `docker-compose.yml`，將 `DEVICE` 改為 `cpu` 並**刪除** `deploy` 區塊。

```yaml
services:
  finance-ai:
    build:
      args:
        DEVICE: cpu  # 改為 cpu
    # 注意：請刪除整個 deploy 區塊，否則會報錯

```

### 3. 啟動服務

```powershell
# --build 確保依照您的 GPU/CPU 設定重新建置映像檔
docker compose up --build

```

---

## 📂 資料與模型配置說明

本系統所有持久化資料皆位於專案根目錄的 `/data` 資料夾，並掛載至容器內的 `/app/data`。

### 1. 資料夾結構

系統啟動時會自動檢查，若對應資料夾不存在會自動建立，但建議保持以下結構：

```text
/Personal-Finance-Manager
└── /data
    ├── /DB        # 存放 SQLite 資料庫 (Finance.db)
    └── /models    # 存放 GGUF 模型檔

```

* **關於資料庫 (`/data/DB`)**：
* 系統會自動在 `/data/DB/` 下建立資料庫檔案。
* **注意**：若您手動修改設定檔，請確保路徑指向 `/app/data/DB/您的檔名.db`。



### 2. 模型管理 (自動 vs 手動)

#### 🤖 自動下載 (預設)

容器初次啟動時，若 `/data/models` 為空，腳本會自動從 HuggingFace 下載 `Llama-3-Taiwan-8B-Instruct` 模型 (約 5.8GB)。

* **優點**：完全自動，無需操作。
* **缺點**：需等待下載完成，依網速約 5-10 分鐘。

#### 🛠️ 手動放入模型

若您已有模型檔案，或想使用其他 GGUF 模型：

1. 將 `.gguf` 檔案放入宿主機的 `data/models/` 資料夾。
2. 前往 Web UI 設定頁面，或修改 `config.py` (需重啟容器)，將模型路徑指向：
`/app/data/models/您的模型檔名.gguf`

---

## 🔗 非 Docker 安裝 (開發者用)

若您需要在本機直接運行 Python 環境進行開發，或不使用 Docker，請參閱詳細的手動安裝文件：

👉 **[點擊查看：手動安裝與環境配置指南 (Manual Setup)](https://www.google.com/search?q=manualDownload.md)**

---

## 📝 常見問題 (FAQ)

* **Q: 啟動後看到 `401 Unauthorized` 錯誤？**
* **A**: 這通常是因為 Repo ID 錯誤或模型被設為私有。目前預設使用公開的 `chienweichang/Llama-3-Taiwan-8B-Instruct-GGUF`，無需 Token。


* **Q: 修改了 `config.py` 或 `docker-compose.yml` 但沒生效？**
* **A**: 請務必執行 `docker compose up --build` 來強制重新建置與載入設定。


* **Q: 資料庫連線失敗 `unable to open database file`？**
* **A**: 請檢查 SQLAlchemy 的 URL 是否為絕對路徑且包含 4 個斜線：`sqlite:////app/data/DB/Finance.db`。