[新手開發指引](https://github.com/TW-RF54732/Personal-Finance-Manager/blob/main/Dev_ReadMe.md)


# 安裝指南

本專案針對 **Windows 11** 與 **Python 3.11.9** 環境優化。
核心依賴 `llama-cpp-python` 易因編譯環境不同而出錯，請務必按照以下順序操作。

## 1. 環境檢測

請確保終端機 (PowerShell) 中顯示正確版本：

```powershell
python --version
# 應顯示 Python 3.11.9
# 若非此版本，請使用 py -3.11 指令替代 python

```

## 2. 專案設定

下載並進入專案目錄：

```powershell
git clone https://github.com/TW-RF54732/Personal-Finance-Manager.git
cd Personal-Finance-Manager

```

## 3. 建立並啟動虛擬環境 (推薦)

為避免依賴衝突，強烈建議使用虛擬環境。

```powershell
# 建立虛擬環境 (.venv)
python -m venv .venv

# 啟動虛擬環境 (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

```

> [!TIP]
> 若出現 `禁止執行指令碼` 錯誤，請先執行：
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`

## 4. 安裝依賴 (預設：CPU 模式)

此模式相容性最高，無需安裝額外驅動，適合大多數開發測試。
我們已在設定檔中指定了預編譯的 CPU Wheel，可直接安裝。

```powershell
# 升級 pip 以確保能解析 whl 檔
python -m pip install --upgrade pip

# 安裝所有依賴 (包含 llama-cpp-python CPU 版)
pip install -r requirements.txt

```

---

## 5. (選用) 啟用 NVIDIA GPU 加速

若您擁有 NVIDIA 顯卡並已安裝 CUDA Toolkit，可透過以下步驟切換至 GPU 版本以提升推論速度。

**前置要求：**

* 已安裝 [CUDA Toolkit 12.x](https://developer.nvidia.com/cuda-downloads)
* 已安裝 Microsoft Visual Studio (C++ 建置工具)

**安裝指令：**
請執行以下指令強制重新安裝支援 CUDA 的版本 (需覆蓋原本的 CPU 版)：

```powershell
# 解除安裝目前的 CPU 版本
pip uninstall llama-cpp-python -y

# 安裝支援 CUDA 12 的版本 (確保版本號與 requirements.txt 一致)
# 注意：若您的 CUDA 版本為 11，請將 cu121 改為 cu117
pip install llama-cpp-python==0.2.90 --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu121

```

> [!NOTE]
> 更多 GPU 版本對應表 (cu117, cu121, cu122 等) 請參閱官方庫 release 頁面。

---

## 6. 驗證安裝

執行以下指令測試是否載入成功：

```powershell
python -c "import llama_cpp; print('Llama-cpp installed successfully')"

```

## 7. LLM 模型準備

本專案使用 `GGUF` 格式模型，請勿下載 PyTorch (`.bin`/`.pth`) 或 Safetensors 格式。

### 步驟 1：建立模型目錄

在專案根目錄建立 `models` 資料夾：

```powershell
mkdir ./data/models

```

### 步驟 2：下載模型

請前往 Hugging Face 下載 GGUF 模型檔案。
**推薦模型 (適合財務分析/中文能力佳)：**

* **llama-3-taiwan-8B-instruct-q5_k_m.ggufF** (針對台灣繁體中文優化)
* 下載連結: [Llama-3-Taiwan-8B-Instruct-GGUF](https://huggingface.co/chienweichang/Llama-3-Taiwan-8B-Instruct-GGUF/tree/main)
* 或者使用通用版: `Meta-Llama-3-8B-Instruct-GGUF`



**建議規格 (依據 16GB RAM)：**

* **檔案名稱包含**: `Q4_K_M.gguf` (約 4-5 GB，速度快) 或 `Q5_K_M.gguf` (約 5-6 GB，精度較高)
* **請勿下載**: `fp16` (檔案過大可能導致 OOM)

### 步驟 3：配置路徑

將下載的 `.gguf` 檔案放入 `data/models/` 或自訂資料夾中。
確認你的配置檔 `data/config.py` 指向正確路徑：

```python
# 範例配置
model_path = "./data/models/Llama-3-Taiwan-8B-Instruct.Q4_K_M.gguf"
```

---

