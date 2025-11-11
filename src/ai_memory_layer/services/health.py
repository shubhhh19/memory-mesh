"""Health reporting service."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from ai_memory_layer import __version__
from ai_memory_layer.config import get_settings
from ai_memory_layer.database import check_database_health


@dataclass
class HealthReport:
    status: str
    database: str
    latency_ms: float | None
    uptime_seconds: float
    environment: str
    version: str
    timestamp: datetime
    notes: str | None = None


class HealthService:
    """Produces health responses with timing metadata."""

    def __init__(self, start_time: datetime) -> None:
        self.start_time = start_time

    async def build_report(self) -> HealthReport:
        settings = get_settings()
        db_ok, latency = await check_database_health()
        latency_ms = latency * 1000 if latency is not None else None
        status = "ok" if db_ok else "degraded"
        uptime = (datetime.now(timezone.utc) - self.start_time).total_seconds()
        return HealthReport(
            status=status,
            database="ok" if db_ok else "down",
            latency_ms=latency_ms,
            uptime_seconds=uptime,
            environment=settings.environment,
            version=__version__,
            timestamp=datetime.now(timezone.utc),
        )
