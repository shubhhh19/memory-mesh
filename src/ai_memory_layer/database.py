"""Database utilities and base declarative class."""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from ai_memory_layer.config import get_settings
from ai_memory_layer.logging import get_logger

logger = get_logger(component="database")


class Base(DeclarativeBase):
    """Declarative base for ORM models."""


def _build_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(settings.database_url, echo=settings.sql_echo, future=True)


engine: AsyncEngine | None = None
SessionFactory: async_sessionmaker[AsyncSession] | None = None


async def init_engine() -> None:
    """Initialise global engine/session factory."""
    global engine, SessionFactory  # noqa: PLW0603
    if engine is None:
        engine = _build_engine()
        SessionFactory = async_sessionmaker(engine, expire_on_commit=False)
        logger.info("database_engine_initialized", url=str(engine.url))


@asynccontextmanager
async def get_session() -> AsyncIterator[AsyncSession]:
    """Yield an async session."""
    if SessionFactory is None:
        await init_engine()
    assert SessionFactory is not None  # nosec - guarded above
    async with SessionFactory() as session:
        yield session


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Context manager usable outside FastAPI dependency injection."""
    if SessionFactory is None:
        await init_engine()
    assert SessionFactory is not None  # nosec - guarded above
    async with SessionFactory() as session:
        yield session


async def check_database_health() -> tuple[bool, float | None]:
    """Ping the database and return (healthy, latency seconds)."""
    if engine is None:
        await init_engine()
    assert engine is not None  # nosec - guarded
    start = time.perf_counter()
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        logger.exception("database_health_check_failed")
        return False, None
    return True, time.perf_counter() - start
