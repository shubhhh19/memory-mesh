"""FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI

from ai_memory_layer import __version__
from ai_memory_layer.config import get_settings
from ai_memory_layer.database import init_engine
from ai_memory_layer.logging import configure_logging
from ai_memory_layer.metrics import MetricsMiddleware, router as metrics_router
from ai_memory_layer.routes import api_router

configure_logging()
START_TIME = datetime.now(timezone.utc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_engine()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        lifespan=lifespan,
    )
    if settings.metrics_enabled:
        app.add_middleware(MetricsMiddleware)
        app.include_router(metrics_router, tags=["metrics"])
    app.include_router(api_router)
    app.state.start_time = START_TIME
    return app


app = create_app()


def run() -> None:
    import uvicorn

    uvicorn.run(
        "ai_memory_layer.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    run()
