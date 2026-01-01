
# 🛠️ 手動安裝與環境配置指南 (Manual Setup)

本指南適用於想要在本地環境 (Host Machine) 直接運行 FinBase 的開發者。
本專案針對 **Windows 11** 與 **Python 3.11.9** 優化，但亦可在 Linux/MacOS 上運行。

## ⚠️ 前置注意事項

1. **Python 版本**：強烈建議使用 **Python 3.11.x**。
* `llama-cpp-python` 的預編譯 Wheel 檔對 Python 版本非常敏感，使用 3.12+ 或 3.10- 可能會找不到對應的安裝檔。


2. **C++ 編譯環境 (僅 GPU 模式需要)**：
* Windows 用戶若要自行編譯 GPU 版本，需安裝 **Visual Studio Community** (勾選 "使用 C++ 的桌面開發")。
* 若使用我們提供的預編譯指令，則只需安裝 **CUDA Toolkit**。



---

## 步驟 1：環境準備

### 1. 檢查 Python 版本

開啟終端機 (PowerShell 或 CMD)，確認版本為 3.11 系列：

```powershell
python --version
# 輸出應為 Python 3.11.x
# 若未安裝，請至 Python 官網下載 3.11.9 版本

```

### 2. 下載專案

```powershell
git clone https://github.com/TW-RF54732/Personal-Finance-Manager.git
cd Personal-Finance-Manager

```

---

## 步驟 2：建立虛擬環境 (Virtual Environment)

為了避免與系統其他專案的依賴衝突，**強烈建議**使用虛擬環境。

```powershell
# 1. 建立名為 .venv 的虛擬環境
python -m venv .venv

# 2. 啟動虛擬環境
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / Mac:
# source .venv/bin/activate

```

> [!TIP]
> **Windows 用戶常見錯誤**：
> 若執行 Activate 時出現「因為這個系統上已停用指令碼執行...」，請以管理員身分執行 PowerShell 並輸入：
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`

---

## 步驟 3：安裝依賴套件

請根據您的硬體設備選擇 **CPU 模式** 或 **GPU 模式** (二選一)。

###  選項 A：CPU 模式 (相容性最高)

若您沒有 NVIDIA 顯卡，或不想設定 CUDA 環境，請使用此模式。

```powershell
# 升級 pip
python -m pip install --upgrade pip

# 安裝依賴
# requirements.txt 已包含指向 CPU 版本的 extra-index-url
pip install -r requirements.txt

```

### 選項 B：NVIDIA GPU 加速模式

若您有 NVIDIA 顯卡且已安裝 [CUDA Toolkit 12.x](https://developer.nvidia.com/cuda-12-1-0-download-archive)。

**關鍵步驟**：必須強制指定安裝支援 CUDA 的 `llama-cpp-python` 版本。

```powershell
# 1. 升級 pip
python -m pip install --upgrade pip

# 2. 安裝基本依賴 (排除 llama-cpp-python，避免裝成 CPU 版)
# 先產生不含 llama-cpp 的暫存清單
Get-Content requirements.txt | Select-String -Pattern "llama-cpp-python" -NotMatch > req_base.txt
pip install -r req_base.txt
# 記得安裝 huggingface 工具
pip install huggingface_hub[cl]

# 3. 安裝支援 CUDA 12 的 llama-cpp-python
# 注意：這裡強制使用預編譯的 CUDA 12 Wheel 檔
pip install llama-cpp-python==0.2.90 --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu121 --force-reinstall --no-cache-dir

```

> [!NOTE]
> * 若您的 CUDA 版本為 11.x，請將網址中的 `cu121` 改為 `cu117`。
> * 驗證安裝：輸入 `python -c "import llama_cpp; print('GPU Lib Loaded')"` 若無報錯即成功。
> 
> 

---

## 步驟 4：資料夾與模型配置

由於手動安裝不會自動執行 Docker 的 `entrypoint.sh`，您需要手動建立資料夾結構。

### 1. 建立目錄

在專案根目錄下執行：

```powershell
mkdir data\DB
mkdir data\models

```

### 2. 下載模型 (GGUF 格式)

本專案預設支援 **Llama-3-Taiwan-8B-Instruct**。

* **下載連結**：[HuggingFace - Llama-3-Taiwan-8B-Instruct-GGUF](https://huggingface.co/chienweichang/Llama-3-Taiwan-8B-Instruct-GGUF/tree/main) 


* **推薦檔案**：`llama-3-taiwan-8B-instruct-q5_k_m.gguf` (兼顧速度與品質) 


* **存放位置**：將下載的 `.gguf` 檔案放入 `data\models\` 資料夾中。

### 3. (進階) 使用 Python 自動下載

如果您已安裝 `huggingface_hub`，也可以執行以下 Python 指令自動下載：

```python
from huggingface_hub import hf_hub_download
hf_hub_download(
    repo_id="chienweichang/Llama-3-Taiwan-8B-Instruct-GGUF",
    filename="llama-3-taiwan-8B-instruct-q5_k_m.gguf",
    local_dir="./data/models",
    local_dir_use_symlinks=False
)

```

## 步驟 5：修改設定檔

請開啟 `data/config.py` (若您有 `data/settings.json` 則優先修改該檔案)，將路徑改為**本地相對路徑**。

### 關鍵修改點：

1. **資料庫 (`sql_url`)**：
* Docker 版 (4 個斜線, 絕對路徑)：`sqlite:////app/data/DB/Finance.db`
* **本地版 (3 個斜線, 相對路徑)**：`sqlite:///data/DB/Finance.db`


2. **模型 (`LLM_model_path`)**：
* Docker 版：`/app/data/models/...`
* **本地版**：`./data/models/...`



### 修改範例

**打開 `data/settings.json` (推薦) 或 `config.py`，修改為：**

```json
{
    "sql_url": "sqlite:///data/DB/Finance.db",
    "goul_path": "./data/goal.json",
    "LLM_model_path": "./data/models/llama-3-taiwan-8B-instruct-q5_k_m.gguf",
    "n_ctx": 0,
    "n_threads": 8,
    "default_system_prompt": "你是一位專業財務顧問...",
    "temperature": 0.1,
    "max_tokens": 800
}

```

> [!IMPORTANT]
> **SQLAlchemy 路徑規則說明**：
> * `sqlite:///` (3 個斜線) 代表 **相對路徑** (相對於執行 `uvicorn` 的目錄)。
> * `sqlite:////` (4 個斜線) 代表 **絕對路徑** (如 Docker 內的 `/app/...` 或 Linux 的 `/home/...`)。
> * **在 Windows 本地執行時，強烈建議使用 3 個斜線的相對路徑**，以避免 Windows 磁碟機代號 (C:/) 造成的路徑解析問題。
> 
>
---

## 步驟 6：啟動服務

完成以上步驟後，即可啟動後端伺服器。

```powershell
# 使用 uvicorn 啟動
# --reload: 程式碼變更時自動重啟 (開發模式)
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

```

啟動成功後，請瀏覽器打開：

* **API 文件 (Swagger UI)**: `http://127.0.0.1:8000/docs`

---

## ❓ 常見問題排除

1. **ImportError: DLL load failed while importing llama_cpp**
* **原因**：缺少 Visual C++ Redistributable 或 CUDA 版本不匹配。
* **解法**：
* 安裝最新版 [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)。
* 確認安裝的 `llama-cpp-python` 版本 (cu121/cu117) 與系統 `nvidia-smi` 顯示的 CUDA 版本相容。




2. **記憶體不足 (OOM)**
* **原因**：模型檔案太大或 RAM/VRAM 不足。
* **解法**：請改下載 `Q4_K_M.gguf` 版本 (檔案較小)，或在 `config.py` 中調整 `n_gpu_layers` 參數 (設為 0 改用純 CPU 跑跑看)。
