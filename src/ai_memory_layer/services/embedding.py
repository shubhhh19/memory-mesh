"""Embedding service abstractions."""

from __future__ import annotations

import hashlib
import math
from typing import Protocol, Sequence

import asyncio
from functools import lru_cache

from ai_memory_layer.config import get_settings
from ai_memory_layer.logging import get_logger

logger = get_logger(component="embedding_service")

try:  # pragma: no cover - optional dependency
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None  # type: ignore[assignment]


class EmbeddingService(Protocol):
    async def embed(self, text: str) -> list[float]:
        ...


class MockEmbeddingService:
    """Deterministic mock embedder for local dev & tests."""

    def __init__(self, dimensions: int | None = None) -> None:
        settings = get_settings()
        self.dimensions = dimensions or settings.embedding_dimensions

    async def embed(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values = [b / 255 for b in digest]
        repeats = math.ceil(self.dimensions / len(values))
        raw = (values * repeats)[: self.dimensions]
        return raw


class SentenceTransformerEmbeddingService:
    """Embedding provider backed by HuggingFace sentence-transformers."""

    def __init__(self, model_name: str, dimensions: int) -> None:
        if SentenceTransformer is None:
            raise RuntimeError(
                "sentence-transformers is required for sentence_transformer provider"
            )
        self.model = _load_model(model_name)
        self.dimensions = dimensions

    async def embed(self, text: str) -> list[float]:
        loop = asyncio.get_running_loop()
        vector = await loop.run_in_executor(
            None, lambda: self.model.encode(text, show_progress_bar=False)  # type: ignore[attr-defined]
        )
        values = vector.tolist() if hasattr(vector, "tolist") else list(vector)
        if len(values) != self.dimensions:
            # pad/truncate to configured dimension
            if len(values) > self.dimensions:
                values = values[: self.dimensions]
            else:
                values.extend([0.0] * (self.dimensions - len(values)))
        return values


@lru_cache(maxsize=1)
def _load_model(model_name: str):
    if SentenceTransformer is None:  # pragma: no cover
        raise RuntimeError("sentence-transformers missing")
    return SentenceTransformer(model_name)


def build_embedding_service(provider: str | None = None) -> EmbeddingService:
    settings = get_settings()
    provider = provider or settings.embedding_provider
    if provider == "sentence_transformer":
        try:
            return SentenceTransformerEmbeddingService(
                model_name=settings.embedding_model_name,
                dimensions=settings.embedding_dimensions,
            )
        except Exception as exc:  # pragma: no cover - fallback for missing model
            logger.warning(
                "sentence_transformer_unavailable_falling_back_to_mock", error=str(exc)
            )
    return MockEmbeddingService(dimensions=settings.embedding_dimensions)
