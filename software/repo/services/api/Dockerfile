FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Copy migration files from parent directory
COPY ../db /app/db
EXPOSE 8000
CMD ["bash","-lc","alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]
