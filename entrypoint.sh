#!/bin/bash
set -e

# 1. 自動建立資料夾結構
# 對應到宿主機的 ./data/DB 和 ./data/models
echo ">>> Checking directories..."
mkdir -p /app/data/DB
mkdir -p /app/data/models

# 2. 設定模型資訊
# 使用 Llama-3-Taiwan-8B-Instruct (Q5_K_M 版本，平衡速度與品質)
REPO_ID="chienweichang/Llama-3-Taiwan-8B-Instruct-GGUF"
FILENAME="llama-3-taiwan-8B-instruct-q5_k_m.gguf"
MODEL_PATH="/app/data/models/$FILENAME"

# 3. 檢查模型是否存在，不存在則自動下載
if [ ! -f "$MODEL_PATH" ]; then
    echo "----------------------------------------------------------------"
    echo "Model not found: $FILENAME"
    echo "Starting automatic download from HuggingFace..."
    echo "Repo: $REPO_ID"
    echo "Target: Q5_K_M (~5.8GB)"
    echo "----------------------------------------------------------------"
    
    # 使用 huggingface-cli 下載
    # --local-dir-use-symlinks False 確保下載的是實體檔案而非連結
# 改用 python -m 呼叫，保證一定找得到
# 使用 python -c 直接呼叫函式庫，這是最穩定的方法
    python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='$REPO_ID', filename='$FILENAME', local_dir='/app/data/models', local_dir_use_symlinks=False)"

    echo ">>> Download complete!"
else
    echo ">>> Model found at $MODEL_PATH. Skipping download."
fi

# 4. 啟動 FastAPI 服務
echo ">>> Starting Uvicorn..."
# 使用 exec 讓 uvicorn 取代當前 shell 成為 PID 1 (確保能正確接收關閉訊號)
exec uvicorn app:app --host 0.0.0.0 --port 8000