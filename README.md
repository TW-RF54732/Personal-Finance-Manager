# Personal Finance Database - FinBase

這是一個結合 **FastAPI** 後端與 **Local LLM (本地大語言模型)** 的個人財務管理系統。
專案已完全容器化，整合 `llama-cpp-python`，支援 **自動化模型下載** 與 **GPU (CUDA) 加速**。

---

## 📋 系統需求與前置準備

本系統採用 Docker 容器化部署，**宿主機（您的電腦）無需安裝 Python 或 Conda**。
在開始之前，請確保您的環境滿足以下軟體與硬體要求：

### 🛠️ 軟體環境 (必備)

請依據您的作業系統，確認已安裝以下工具。假設您是從一台乾淨的電腦開始：

#### 1. 基礎工具 (所有用戶)

* **Git**: 用於下載專案程式碼。
* Windows/Mac/Linux: 請至 [Git 官網](https://git-scm.com/install/) 下載並安裝。



#### 2. 容器運行環境 (擇一安裝)

* **Windows / Mac 用戶**: 安裝 **Docker Desktop**。
* **Windows 用戶特別注意**：
1. 安裝時請確保勾選 **"Use WSL 2 instead of Hyper-V"** (推薦)。
2. 系統需先啟用 **WSL 2** (Windows Subsystem for Linux)。
3. 在 Docker Desktop 設定 (`Settings` > `General`) 中確認已勾選 **"Use the WSL 2 based engine"**。




* **Linux 用戶**: 安裝 **Docker Engine** 與 **Docker Compose**。

#### 3. GPU 加速支援 (僅 NVIDIA 顯卡用戶需要)

若您計畫使用 GPU 加速 (Llama-3 運算)，宿主機必須滿足以下條件：

* **通用需求**:
* 宿主機必須安裝最新的 **NVIDIA Driver** (驅動程式)，請至 NVIDIA 官網下載。
* *注意：容器內已包含 CUDA Toolkit，您無需在宿主機安裝 CUDA Toolkit，但必須有驅動。*


* **Linux 用戶額外需求**:
  *   必須安裝 **[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)**，Docker 才能調用顯卡資源。


* **Windows 用戶**:
  *   Docker Desktop (WSL 2 模式) 預設已支援 GPU 直通，通常無需額外設定。



### 💻 硬體建議

* **CPU**: 建議 4 核心以上 (若無顯卡，建議 M1/M2/M3 或高效能 CPU)。
* **RAM (記憶體)**:
* **CPU 模式**: 至少 16GB (模型會佔用系統記憶體)。
* **GPU 模式**: 系統記憶體至少 8GB。


* **VRAM (顯示卡記憶體)**:
* **GPU 模式**: 至少 **6GB** (推薦 8GB 以上以獲得最佳體驗)。


* **硬碟空間**: 至少預留 **10GB** 可用空間 (包含 Docker Image 建置緩存與 LLM 模型檔)。

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
> [!WARNING]
>　執行docker指令時確保docker應用有在運行
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
└── /data          # Docker掛載子資料夾於容器中的/app/data
    ├── /DB        # 存放 SQLite 資料庫 (Finance.db)
    └── /models    # 存放 GGUF 模型檔

```
* **關於資料庫 (`/data/DB`)**：
* 系統會自動在 `/data/DB/` 下建立資料庫檔案。
* **注意**：若您手動修改設定檔，請確保路徑指向 `/app/data/DB/您的檔名.db`。



### 2. 模型管理 (自動 vs 手動)

####  自動下載 (預設)

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

👉 **[點擊查看：手動安裝與環境配置指南 (Manual Setup)](https://github.com/TW-RF54732/Personal-Finance-Manager/blob/main/manualDownload.md)**

---
# 測試
目前是測試版，登入帳密皆為'test'


## 📝 常見問題 (FAQ)

* **Q: 啟動後看到 `401 Unauthorized` 錯誤？**
* **A**: 這通常是因為 Repo ID 錯誤或模型被設為私有。目前預設使用公開的 `chienweichang/Llama-3-Taiwan-8B-Instruct-GGUF`，無需 Token。


* **Q: 修改了 `config.py` 或 `docker-compose.yml` 但沒生效？**
* **A**: 請務必執行 `docker compose up --build` 來強制重新建置與載入設定。


* **Q: 資料庫連線失敗 `unable to open database file`？**
* **A**: 請檢查 SQLAlchemy 的 URL 是否為絕對路徑且包含 4 個斜線：`sqlite:////app/data/DB/Finance.db`。
