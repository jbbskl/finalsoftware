# services/worker/celery_app.py
import os
from celery import Celery

broker_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery("worker", broker=broker_url, backend=broker_url)

# Keep default 'celery' queue for now (simplest while setting up)
# If you later want a dedicated 'runs' queue, we can add routes and start worker with -Q runs.
# app.conf.task_routes = {"tasks.run_bot": {"queue": "runs"}}

app.conf.worker_prefetch_multiplier = 1
app.conf.broker_transport_options = {"visibility_timeout": 3600}

# 🔑 This import registers tasks defined in worker.py
import worker  # noqa: F401
