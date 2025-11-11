"""Prometheus metrics instrumentation."""

from __future__ import annotations

import time

from fastapi import APIRouter, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

try:  # pragma: no cover - optional dependency
    from prometheus_client import (
        CONTENT_TYPE_LATEST,
        Counter,
        Histogram,
        generate_latest,
    )

    PROMETHEUS_AVAILABLE = True
except ImportError:  # pragma: no cover
    PROMETHEUS_AVAILABLE = False

router = APIRouter()

if PROMETHEUS_AVAILABLE:
    REQUEST_COUNT = Counter(
        "aiml_requests_total",
        "Total HTTP requests",
        ["method", "path", "status"],
    )
    REQUEST_LATENCY = Histogram(
        "aiml_request_latency_seconds",
        "Request latency in seconds",
        ["method", "path"],
    )

    @router.get("/metrics")
    async def metrics() -> Response:
        """Expose Prometheus metrics."""
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    class MetricsMiddleware(BaseHTTPMiddleware):
        """Middleware that records request metrics."""

        async def dispatch(self, request: Request, call_next):
            if request.url.path == "/metrics":
                return await call_next(request)
            start = time.perf_counter()
            response = await call_next(request)
            duration = time.perf_counter() - start
            REQUEST_COUNT.labels(
                method=request.method,
                path=request.url.path,
                status=str(response.status_code),
            ).inc()
            REQUEST_LATENCY.labels(method=request.method, path=request.url.path).observe(
                duration
            )
            return response

else:

    @router.get("/metrics")
    async def metrics() -> Response:  # type: ignore[override]
        return Response("metrics unavailable", media_type="text/plain")

    class MetricsMiddleware(BaseHTTPMiddleware):  # type: ignore[override]
        async def dispatch(self, request: Request, call_next):
            return await call_next(request)
