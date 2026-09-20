# Multi-stage lightweight production Dockerfile for Member 4 Agent Service (Commit 3)
FROM python:3.13-slim

WORKDIR /app

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies if required for psycopg / networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code (secrets and dev files excluded via .dockerignore)
COPY app/ ./app/

# Expose FastAPI service port
EXPOSE 8001

# Run FastAPI service via production Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
