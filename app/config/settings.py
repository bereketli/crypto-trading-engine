from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Crypto Exchange"
    debug: bool = False

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    database_url: str
    redis_url: str = "redis://localhost:6379"
    kafka_bootstrap_servers: str = "localhost:9092"

    db_pool_size: int = 10
    db_max_overflow: int = 5
    db_echo: bool = False

    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
