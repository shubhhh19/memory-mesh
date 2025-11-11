"""High-level orchestration for message ingest and retrieval."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from ai_memory_layer.config import get_settings
from ai_memory_layer.logging import get_logger
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
        importance = payload.importance_override
        if importance is None:
            importance = self.scorer.score(
                created_at=message.created_at,
                role=message.role,
                explicit_importance=None,
            )
        else:
            importance = max(0.0, min(importance, 1.0))

        try:
            embedding = await self.embedder.embed(payload.content)
            status = "completed"
        except Exception:
            logger.exception("embedding_failed", message_id=str(message.id))
            embedding = None
            status = "failed"
        message = await self.repository.update_message_embedding(
            session,
            message.id,
            embedding=embedding,
            importance_score=importance,
            status=status,
        )
        await session.commit()
        assert message is not None
        return MessageResponse.model_validate(message)

    async def retrieve(
        self,
        session: AsyncSession,
        params: MemorySearchParams,
    ) -> MemorySearchResponse:
        settings = get_settings()
        query_embedding = await self.embedder.embed(params.query)
        candidate_limit = min(params.candidate_limit, settings.max_results * 10)
        top_k = min(params.top_k, settings.max_results)
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
