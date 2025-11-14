import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_rate_limit_triggers(client_builder, settings_override):
    settings_override(global_rate_limit="1/minute")
    async with client_builder() as client:
        payload = {
            "tenant_id": "tenant-rate",
            "conversation_id": "c1",
            "role": "user",
            "content": "hi",
        }
        first = await client.post("/v1/messages", json=payload)
        assert first.status_code == 202
        second = await client.post("/v1/messages", json=payload)
        assert second.status_code == 429
        assert "x-request-id" in second.headers
