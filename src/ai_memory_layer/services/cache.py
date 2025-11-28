"""Caching utilities for hot paths."""

from __future__ import annotations

import asyncio
import hashlib
import time
from typing import Any

from ai_memory_layer.config import get_settings
from ai_memory_layer.logging import get_logger

logger = get_logger(component="cache")


class CacheBackend:
    async def get(self, key: str) -> Any:  # pragma: no cover - protocol shim
        raise NotImplementedError

    async def set(self, key: str, value: Any, ttl: float) -> None:  # pragma: no cover
        raise NotImplementedError

    async def delete_prefix(self, prefix: str) -> None:  # pragma: no cover
        raise NotImplementedError


class InMemoryCache(CacheBackend):
    """Lightweight, asyncio-safe TTL cache."""

    def __init__(self, max_items: int = 2000) -> None:
        self.max_items = max_items
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            item = self._store.get(key)
            if not item:
                return None
            expires_at, value = item
            if expires_at < time.time():
                self._store.pop(key, None)
                return None
            return value

    async def set(self, key: str, value: Any, ttl: float) -> None:
        async with self._lock:
            if len(self._store) >= self.max_items:
                # Drop the oldest item to make room
                oldest_key = min(self._store, key=lambda k: self._store[k][0])
                self._store.pop(oldest_key, None)
            self._store[key] = (time.time() + ttl, value)

    async def delete_prefix(self, prefix: str) -> None:
        async with self._lock:
            for key in list(self._store.keys()):
                if key.startswith(prefix):
                    self._store.pop(key, None)


def _default_backend() -> CacheBackend:
    settings = get_settings()
    return InMemoryCache(max_items=settings.cache_max_items)


class CacheService:
    """High-level cache tailored for retrieval and embeddings."""

    def __init__(self, backend: CacheBackend | None = None, enabled: bool | None = None) -> None:
        settings = get_settings()
        self.enabled = enabled if enabled is not None else settings.cache_enabled
        self.backend = backend or _default_backend()
        self.search_ttl = settings.cache_search_ttl_seconds
        self.embedding_ttl = settings.cache_embedding_ttl_seconds

    def search_key(
        self,
        *,
        tenant_id: str,
        conversation_id: str | None,
        query: str,
        top_k: int,
        candidate_limit: int,
    ) -> str:
        raw = "|".join(
            [
                tenant_id,
                conversation_id or "*",
                str(top_k),
                str(candidate_limit),
                query,
            ]
        )
        digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return f"search:{tenant_id}:{conversation_id or '*'}:{digest}"

    def embedding_key(self, text: str) -> str:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return f"embedding:{digest}"

    async def get(self, key: str) -> Any | None:
        if not self.enabled:
            return None
        return await self.backend.get(key)

    async def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        if not self.enabled:
            return
        await self.backend.set(key, value, ttl or self.search_ttl)

    async def invalidate_search(self, tenant_id: str, conversation_id: str | None = None) -> None:
        if not self.enabled:
            return
        prefix = f"search:{tenant_id}:{conversation_id or '*'}:"
        await self.backend.delete_prefix(prefix)
        logger.debug(
            "cache_invalidated",
            tenant_id=tenant_id,
            conversation_id=conversation_id,
        )
