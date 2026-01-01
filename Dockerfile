FROM python:3.11-slim-bookworm

WORKDIR /app

ARG DEVICE=cpu

# 安裝基本工具 (加入 libgomp1 支援 llama-cpp)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1. 安裝一般依賴 + HuggingFace 工具
# [新增] pip install huggingface_hub 用於下載模型
RUN grep -v "llama-cpp-python" requirements.txt | \
    grep -v "extra-index-url" > req_base.txt && \
    pip install --no-cache-dir -r req_base.txt && \
    pip install --no-cache-dir "huggingface_hub[cl]"

# 2. 智慧安裝邏輯 (GPU/CPU)
RUN if [ "$DEVICE" = "gpu" ]; then \
        echo ">>> Mode: GPU (CUDA 12). Downloading pre-built wheels + Runtime..." && \
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

# [新增] 複製 entrypoint 腳本並給予執行權限
COPY entrypoint.sh .
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# 設定環境變數
ENV LD_LIBRARY_PATH=/usr/local/lib/python3.11/site-packages/nvidia/cuda_runtime/lib:/usr/local/lib/python3.11/site-packages/nvidia/cublas/lib:$LD_LIBRARY_PATH
ENV PYTHONUNBUFFERED=1

# [關鍵修改] 改用 ENTRYPOINT 執行腳本，而非直接 CMD
ENTRYPOINT ["/app/entrypoint.sh"]