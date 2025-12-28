FROM python:3.11-slim-bookworm

WORKDIR /app

ARG DEVICE=cpu

# 安裝基本工具
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1. 安裝一般依賴 (排除 llama-cpp)
RUN grep -v "llama-cpp-python" requirements.txt | grep -v "extra-index-url" > req_base.txt && \
    pip install --no-cache-dir -r req_base.txt

# 2. 智慧安裝邏輯 (修正版)
# GPU 模式：額外安裝 nvidia-cuda-runtime 與 cublas，並修正路徑
RUN if [ "$DEVICE" = "gpu" ]; then \
        echo ">>> Mode: GPU (CUDA 12). Downloading pre-built wheels + Runtime..." && \
        # 安裝 llama-cpp 與 NVIDIA 運行庫 (補齊缺失的 .so 檔)
        pip install llama-cpp-python==0.2.90 \
        --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu121 \
        nvidia-cuda-runtime-cu12 \
        nvidia-cublas-cu12 \
        --no-cache-dir --force-reinstall --upgrade; \
    else \
        echo ">>> Mode: CPU (Standard)..." && \
        pip install llama-cpp-python==0.2.90 \
        --no-cache-dir --force-reinstall --upgrade; \
    fi

COPY . .

# [關鍵修正] 設定 LD_LIBRARY_PATH
# 讓 Linux 知道去 Python 的 site-packages 裡找 NVIDIA 的 .so 檔
ENV LD_LIBRARY_PATH=/usr/local/lib/python3.11/site-packages/nvidia/cuda_runtime/lib:/usr/local/lib/python3.11/site-packages/nvidia/cublas/lib:$LD_LIBRARY_PATH

ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]