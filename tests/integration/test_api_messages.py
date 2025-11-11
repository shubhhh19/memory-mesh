import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_search_message(client: AsyncClient):
    payload = {
        "tenant_id": "tenant-a",
        "conversation_id": "conv-1",
        "role": "user",
        "content": "How do I reset my password?",
        "metadata": {"channel": "web"},
    }
    response = await client.post("/v1/messages", json=payload)
    assert response.status_code == 202
    message_id = response.json()["id"]

    get_response = await client.get(f"/v1/messages/{message_id}")
    assert get_response.status_code == 200

    search_response = await client.get(
        "/v1/memory/search",
        params={"tenant_id": "tenant-a", "query": "password reset", "top_k": 3},
    )
    assert search_response.status_code == 200
    data = search_response.json()
    assert data["total"] >= 1
