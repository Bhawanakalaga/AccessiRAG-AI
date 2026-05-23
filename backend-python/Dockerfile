# Phase 5: Production Dockerization & Optimization Layout
# AccessiRAG AI Distributed Backend Service container configuration

FROM python:3.11-slim

# System setup
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests and run parallel package installations
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source assets
COPY . .

# Expose internal FastAPI port
EXPOSE 8000

# Configure production environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Start the uvicorn API gateway service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
