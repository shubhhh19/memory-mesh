"""Configuration for the AI Memory Layer service."""

from functools import lru_cache
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.engine.url import URL

_OVERRIDES: dict[str, Any] = {}


class ImportanceWeights(BaseModel):
    recency: float = 0.4
    role: float = 0.2
    explicit: float = 0.4

    @field_validator("*")
    @classmethod
    def non_negative(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Importance weights must be non-negative")
        return value

    def normalized(self) -> "ImportanceWeights":
        total = self.recency + self.role + self.explicit
        if total == 0:
            return self
        return ImportanceWeights(
            recency=self.recency / total,
            role=self.role / total,
            explicit=self.explicit / total,
        )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MEMORY_", env_file=".env", extra="ignore")

    app_name: str = "AI Memory Layer"
    environment: str = Field(default="local", description="Deployment environment name")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    database_url: str = Field(
        default="sqlite+aiosqlite:///./memory_layer.db", alias="DATABASE_URL"
    )
    sql_echo: bool = Field(default=False, alias="SQL_ECHO")

    embedding_dimensions: int = Field(default=1536, alias="EMBEDDING_DIMENSIONS")
    embedding_provider: Literal["mock", "sentence_transformer"] = Field(
        default="sentence_transformer", alias="EMBEDDING_PROVIDER"
    )
    embedding_model_name: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2", alias="EMBEDDING_MODEL_NAME"
    )
    max_results: int = Field(default=8, alias="MAX_RESULTS")
    importance_weights: ImportanceWeights = Field(
        default_factory=ImportanceWeights, alias="IMPORTANCE_WEIGHTS"
    )
    async_embeddings: bool = Field(default=False, alias="ASYNC_EMBEDDINGS")

    retention_max_age_days: int = Field(default=30, alias="RETENTION_MAX_AGE_DAYS")
    retention_importance_threshold: float = Field(
        default=0.35, alias="RETENTION_IMPORTANCE_THRESHOLD"
    )
    retention_delete_after_days: int = Field(default=90, alias="RETENTION_DELETE_AFTER_DAYS")
    retention_schedule_seconds: int = Field(default=0, alias="RETENTION_SCHEDULE_SECONDS")
    retention_tenants: list[str] = Field(default_factory=list, alias="RETENTION_TENANTS")

    healthcheck_timeout_seconds: float = Field(
        default=2.0, alias="HEALTHCHECK_TIMEOUT_SECONDS"
    )
    metrics_enabled: bool = Field(default=True, alias="ENABLE_METRICS")
    api_keys: list[str] = Field(default_factory=list, alias="API_KEYS")

    @field_validator("api_keys", mode="before")
    @classmethod
    def _split_api_keys(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("retention_tenants", mode="before")
    @classmethod
    def _split_tenants(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    def sync_database_url(self) -> str:
        """Return sync-compatible database URL for Alembic/migrations."""
        url: URL = make_url(self.database_url)
        if url.drivername.endswith("+asyncpg"):
            url = url.set(drivername=url.drivername.replace("+asyncpg", "+psycopg"))
        elif url.drivername.endswith("+aiosqlite"):
            url = url.set(drivername="sqlite")
        return str(url)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""
    settings = Settings()
    if _OVERRIDES:
        return settings.model_copy(update=_OVERRIDES)
    return settings


def override_settings(**overrides: Any) -> Settings:
    """Apply runtime overrides (primarily for testing)."""
    global _OVERRIDES
    _OVERRIDES = overrides
    get_settings.cache_clear()
    return get_settings()


def reset_overrides() -> None:
    """Reset any runtime overrides."""
    global _OVERRIDES
    _OVERRIDES = {}
    get_settings.cache_clear()
