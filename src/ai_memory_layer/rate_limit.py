"""In-process rate limiting middleware."""

from __future__ import annotations

import re
import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import Depends, HTTPException, Request, status

from ai_memory_layer.config import get_settings

RATE_LIMIT_PATTERN = re.compile(r"(?P<count>\d+)\/(?P<unit>second|minute|hour)")
_LIMITERS: dict[str, RateLimiter] = {}


class RateLimiter:
    def __init__(self, limit: str) -> None:
        self.max_calls, self.window = self._parse(limit)
        self.calls: defaultdict[str, deque[float]] = defaultdict(deque)

    def _parse(self, limit: str) -> tuple[int, float]:
        match = RATE_LIMIT_PATTERN.fullmatch(limit.replace(" ", ""))
        if not match:
            raise ValueError(f"Invalid rate limit format: {limit}")
        count = int(match.group("count"))
        unit = match.group("unit")
        seconds = {"second": 1, "minute": 60, "hour": 3600}[unit]
        return count, float(seconds)

    def hit(self, identifier: str) -> bool:
        now = time.monotonic()
        q = self.calls[identifier]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.max_calls:
            return False
        q.append(now)
        return True


def rate_limit_dependency(limit: str | None = None) -> Callable[[Request], None]:
    def dependency(request: Request) -> None:
        limiter = _get_limiter(limit)
        key = request.headers.get("x-forwarded-for") or request.client.host or "unknown"
        if not limiter.hit(key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )

    return dependency


def _get_limiter(limit: str | None) -> RateLimiter:
    limit_string = limit or get_settings().global_rate_limit
    limiter = _LIMITERS.get(limit_string)
    if limiter is None:
        limiter = RateLimiter(limit_string)
        _LIMITERS[limit_string] = limiter
    return limiter


def reset_rate_limiter_cache() -> None:
    _LIMITERS.clear()
