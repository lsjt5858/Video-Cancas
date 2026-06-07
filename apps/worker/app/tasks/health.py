from app.main import celery_app


@celery_app.task(name="health.ping")
def ping() -> dict[str, str]:
    return {"status": "ok", "service": "worker"}
