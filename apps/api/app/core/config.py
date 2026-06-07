from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Video Cancas API"
    web_origin: str = "http://localhost:5173"
    database_url: str = "postgresql+psycopg://video_cancas:video_cancas@localhost:5432/video_cancas"
    redis_url: str = "redis://localhost:6379/0"
    s3_endpoint: str = "http://localhost:9000"
    s3_bucket: str = "video-cancas"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
