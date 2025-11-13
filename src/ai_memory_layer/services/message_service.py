"""High-level orchestration for message ingest and retrieval."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from ai_memory_layer.config import Settings, get_settings
from ai_memory_layer.logging import get_logger
from ai_memory_layer.models.memory import Message
from ai_memory_layer.repositories.memory_repository import MemoryRepository
from ai_memory_layer.schemas.messages import MessageCreate, MessageResponse
from ai_memory_layer.schemas.memory import MemorySearchParams, MemorySearchResponse, MemorySearchResult
from ai_memory_layer.services.embedding import EmbeddingService, build_embedding_service
from ai_memory_layer.services.importance import ImportanceScorer
from ai_memory_layer.services.retrieval import MemoryRetriever, default_retriever

logger = get_logger(component="message_service")


@dataclass
class MessageService:
    repository: MemoryRepository = MemoryRepository()
    embedder: EmbeddingService = build_embedding_service()
    scorer: ImportanceScorer = ImportanceScorer()
    retriever: MemoryRetriever = default_retriever()
    settings: Settings = field(default_factory=get_settings)

    async def ingest(
        self, session: AsyncSession, payload: MessageCreate
    ) -> MessageResponse:
        message = await self.repository.create_message(
            session,
            tenant_id=payload.tenant_id,
            conversation_id=payload.conversation_id,
            role=payload.role,
            content=payload.content,
            metadata=payload.metadata or {},
        )
        if self.settings.async_embeddings:
            await self.repository.enqueue_embedding_job(session, message.id)
            await session.commit()
            await self._schedule_embedding_job(message.id)
            return MessageResponse.model_validate(message)

        message = await self._apply_embedding(
            session,
            message=message,
            content=payload.content,
            explicit_importance=payload.importance_override,
        )
        await session.commit()
        return MessageResponse.model_validate(message)

    async def retrieve(
        self,
        session: AsyncSession,
        params: MemorySearchParams,
    ) -> MemorySearchResponse:
        query_embedding = await self.embedder.embed(params.query)
        candidate_limit = min(params.candidate_limit, self.settings.max_results * 10)
        top_k = min(params.top_k, self.settings.max_results)
        candidates = await self.repository.list_active_messages(
            session,
            tenant_id=params.tenant_id,
            conversation_id=params.conversation_id,
            importance_min=params.importance_min,
            limit=candidate_limit,
        )
        ranked = self.retriever.rank(
            query_embedding=query_embedding,
            candidates=candidates,
            top_k=top_k,
        )
        results = [
            MemorySearchResult(
                message_id=item.message.id,
                score=item.score,
                similarity=item.similarity,
                decay=item.decay,
                content=item.message.content,
                role=item.message.role,
                metadata=item.message.message_metadata,
                created_at=item.message.created_at,
                importance=item.message.importance_score,
            )
            for item in ranked
        ]
        return MemorySearchResponse(
            total=len(results),
            items=results,
        )

    async def fetch(self, session: AsyncSession, message_id: UUID) -> MessageResponse | None:
        message = await self.repository.get_message(session, message_id)
        if message is None:
            return None
        return MessageResponse.model_validate(message)

    async def _apply_embedding(
        self,
        session: AsyncSession,
        *,
        message: Message,
        content: str,
        explicit_importance: Optional[float],
    ):
        base_importance = explicit_importance
        if base_importance is None:
            base_importance = self.scorer.score(
                created_at=message.created_at,
                role=message.role,
                explicit_importance=None,
            )
        else:
            base_importance = max(0.0, min(base_importance, 1.0))

        try:
            embedding = await self.embedder.embed(content)
            status = "completed"
            error = None
        except Exception as exc:
            logger.exception("embedding_failed", message_id=str(message.id))
            embedding = None
            status = "failed"
            error = str(exc)

        updated = await self.repository.update_message_embedding(
            session,
            message.id,
            embedding=embedding,
            importance_score=base_importance,
            status=status,
        )
        if self.settings.async_embeddings:
            await self.repository.update_embedding_job(
                session, message.id, status=status, error=error
            )
        return updated

    async def _schedule_embedding_job(self, message_id: UUID) -> None:
        if not self.settings.async_embeddings:
            return
        from ai_memory_layer.database import session_scope

        async def worker() -> None:
            async with session_scope() as session:
                existing = await self.repository.get_message(session, message_id)
                if existing is None:
                    return
                await self._apply_embedding(
                    session,
                    message=existing,
                    content=existing.content,
                    explicit_importance=existing.importance_score,
                )
                await session.commit()

        import asyncio

        asyncio.create_task(worker())
