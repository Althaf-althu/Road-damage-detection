from celery import Celery
from app.config_apis import app_config
import os

REDIS_URL = os.getenv("REDIS_URL", app_config.REDIS_URL)

celery_app = Celery(
    "road_damage",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

