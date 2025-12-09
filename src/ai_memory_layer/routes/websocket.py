"""WebSocket routes for real-time features."""

from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from ai_memory_layer.database import get_session
from ai_memory_layer.models.user import User
from ai_memory_layer.security import get_current_user_from_token
from ai_memory_layer.services.message_service import MessageService

router = APIRouter(prefix="/ws", tags=["websocket"])


async def authenticate_websocket_user(
    websocket: WebSocket,
    token: str | None,
    tenant_id: str,
) -> User | None:
    """
    Authenticate WebSocket connection and verify tenant access.
    
    Returns:
        User object if authenticated and authorized, None otherwise.
        Closes the WebSocket connection if authentication fails.
    """
    # Validate tenant_id format to prevent injection
    if not tenant_id or len(tenant_id) > 64 or not all(c.isalnum() or c in ('-', '_') for c in tenant_id):
        await websocket.close(code=1008, reason="Invalid tenant ID format")
        return None
    
    # Require authentication for tenant-specific endpoints
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return None
    
    # Verify token and tenant access
    user = None
    try:
        async for session in get_session():
            try:
                user = await get_current_user_from_token(
                    HTTPAuthorizationCredentials(scheme="Bearer", credentials=token),
                    session,
                )
                if user:
                    # Verify tenant access
                    if user.tenant_id and user.tenant_id != tenant_id:
                        await websocket.close(code=1008, reason="Access denied to this tenant")
                        return None
                    break
            except Exception:
                pass
            break
    except Exception:
        pass
    
    if not user:
        await websocket.close(code=1008, reason="Invalid or expired token")
        return None
    
    return user


# Simple connection manager
class ConnectionManager:
    """Manages WebSocket connections."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str):
        """Connect a WebSocket for a tenant."""
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = []
        self.active_connections[tenant_id].append(websocket)

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        """Disconnect a WebSocket."""
        if tenant_id in self.active_connections:
            self.active_connections[tenant_id].remove(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        await websocket.send_json(message)

    async def broadcast_to_tenant(self, message: dict, tenant_id: str):
        """Broadcast a message to all connections for a tenant."""
        if tenant_id not in self.active_connections:
            return
        
        # Rebuild list to handle disconnections efficiently
        active = []
        for connection in self.active_connections[tenant_id]:
            try:
                await connection.send_json(message)
                active.append(connection)
            except Exception:
                # Connection is dead, don't add to active list
                pass
        
        # Update active connections list
        self.active_connections[tenant_id] = active


manager = ConnectionManager()
message_service = MessageService()


@router.websocket("/messages/{tenant_id}")
async def websocket_messages(
    websocket: WebSocket,
    tenant_id: str,
    token: str | None = None,
):
    """WebSocket endpoint for real-time message updates."""
    # Authenticate and verify tenant access
    user = await authenticate_websocket_user(websocket, token, tenant_id)
    if not user:
        return  # Connection already closed by authenticate_websocket_user
    
    await manager.connect(websocket, tenant_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                action = message_data.get("action")
                
                if action == "subscribe":
                    # Client wants to subscribe to updates
                    await manager.send_personal_message(
                        {"type": "subscribed", "tenant_id": tenant_id},
                        websocket,
                    )
                elif action == "ping":
                    # Heartbeat
                    await manager.send_personal_message(
                        {"type": "pong"},
                        websocket,
                    )
                else:
                    await manager.send_personal_message(
                        {"type": "error", "message": f"Unknown action: {action}"},
                        websocket,
                    )
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"type": "error", "message": "Invalid JSON"},
                    websocket,
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)


@router.websocket("/stream/{tenant_id}")
async def websocket_stream(
    websocket: WebSocket,
    tenant_id: str,
    token: str | None = None,
    conversation_id: str | None = None,
):
    """WebSocket endpoint for streaming message search results."""
    # Authenticate and verify tenant access
    user = await authenticate_websocket_user(websocket, token, tenant_id)
    if not user:
        return  # Connection already closed by authenticate_websocket_user
    
    await manager.connect(websocket, tenant_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                query = message_data.get("query")
                
                if not query:
                    await manager.send_personal_message(
                        {"type": "error", "message": "Query is required"},
                        websocket,
                    )
                    continue
                
                # Perform search
                from ai_memory_layer.database import get_read_session
                from ai_memory_layer.schemas.memory import MemorySearchParams
                
                async for session in get_read_session():
                    params = MemorySearchParams(
                        tenant_id=tenant_id,
                        conversation_id=conversation_id,
                        query=query,
                        top_k=message_data.get("top_k", 5),
                    )
                    
                    results = await message_service.retrieve(session, params)
                    
                    # Stream results
                    await manager.send_personal_message(
                        {
                            "type": "search_results",
                            "query": query,
                            "results": [
                                {
                                    "message_id": str(item.message_id),
                                    "content": item.content,
                                    "role": item.role,
                                    "score": item.score,
                                    "importance": item.importance,
                                }
                                for item in results.items
                            ],
                        },
                        websocket,
                    )
                    break
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"type": "error", "message": "Invalid JSON"},
                    websocket,
                )
            except Exception as e:
                await manager.send_personal_message(
                    {"type": "error", "message": str(e)},
                    websocket,
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)


# Helper function to broadcast message events
async def broadcast_message_event(tenant_id: str, event_type: str, data: dict):
    """Broadcast a message event to all connected clients for a tenant."""
    await manager.broadcast_to_tenant(
        {
            "type": "message_event",
            "event": event_type,
            "data": data,
        },
        tenant_id,
    )

