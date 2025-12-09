"""API routers."""

from fastapi import APIRouter

from ai_memory_layer.routes import admin, analytics, auth, conversations, memory, messages, retention

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth.router, tags=["authentication"])
api_router.include_router(conversations.router, tags=["conversations"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(memory.router, prefix="/memory", tags=["memory"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(retention.router, tags=["retention"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
