from celery import Celery
from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = WorkerSettings()

celery_app = Celery(
    "video_cancas_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.health"],
)
