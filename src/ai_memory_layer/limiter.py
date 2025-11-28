
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from ai_memory_layer.config import get_settings


def tenant_or_ip(request: Request) -> str:
    tenant_id = (
        request.headers.get("x-tenant-id")
        or request.path_params.get("tenant_id")
        or request.query_params.get("tenant_id")
    )
    if tenant_id:
        return tenant_id
    return get_remote_address(request)


limiter = Limiter(
    key_func=tenant_or_ip,
    default_limits=[get_settings().global_rate_limit],
)
