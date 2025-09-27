FROM python:3.11-slim
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc build-essential python3-dev libffi-dev libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Set PYTHONPATH to ensure imports work
ENV PYTHONPATH=/app

EXPOSE 8000
CMD ["bash","-lc","alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]
