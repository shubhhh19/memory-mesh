"""Security helpers (API key enforcement)."""

from __future__ import annotations

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from ai_memory_layer.config import get_settings

API_KEY_HEADER = APIKeyHeader(name="x-api-key", auto_error=False)


async def require_api_key(api_key: str | None = Security(API_KEY_HEADER)) -> str | None:
    """Validate incoming API key if keys are configured."""
    settings = get_settings()
    if not settings.api_keys:
        return None
    if api_key and api_key in settings.api_keys:
        return api_key
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
