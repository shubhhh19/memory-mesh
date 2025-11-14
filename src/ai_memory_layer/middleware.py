"""Custom middleware utilities."""

from __future__ import annotations

import asyncio
import uuid
from contextvars import ContextVar

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

request_id_ctx_var: ContextVar[str | None] = ContextVar("request_id", default=None)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request ID to each request/response pair."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        token = request_id_ctx_var.set(request_id)
        try:
            response: Response = await call_next(request)
        finally:
            request_id_ctx_var.reset(token)
        response.headers["x-request-id"] = request_id
        request.state.request_id = request_id
        return response


class TimeoutMiddleware(BaseHTTPMiddleware):
    """Abort requests that exceed the configured timeout."""

    def __init__(self, app, timeout: float) -> None:
        super().__init__(app)
        self.timeout = timeout

    async def dispatch(self, request: Request, call_next):
        try:
            return await asyncio.wait_for(call_next(request), timeout=self.timeout)
        except asyncio.TimeoutError:
            return Response(
                content='{"detail":"Request timeout"}',
                status_code=504,
                media_type="application/json",
            )
