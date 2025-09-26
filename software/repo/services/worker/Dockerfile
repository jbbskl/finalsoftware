FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["bash","-lc","celery -A celery_app.app worker --loglevel=INFO --concurrency=1"]
