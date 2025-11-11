# AI Memory Layer

Deterministic backend memory service for conversational AI systems. The service stores, retrieves, and retires conversational memories using transparent policies so LLM-based products can stay stateless.

## Project Snapshot
- **Framework:** FastAPI (Python 3.11+)
- **Storage:** Postgres + pgvector (SQLAlchemy models defined, migrations via Alembic)
- **Core Components:** Message ingest, retrieval, importance scoring, retention/archival jobs, health/admin APIs.

## Getting Started
1. **Install dependencies**
   ```bash
   uv sync  # or: pip install -e .[dev]
   ```
2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Update connection strings, embedding dimensions, and feature toggles.
3. **Create database & run migrations**
   ```bash
   alembic upgrade head
   ```
4. **Run the API**
   ```bash
   uvicorn ai_memory_layer.main:app --reload
   ```
5. **Explore Docs**
   Visit `http://localhost:8000/docs` for the OpenAPI spec.

### Docker Compose
Use the bundled Postgres + API stack:
```bash
docker compose up --build
```
The API listens on `http://localhost:8000` and pgvector-backed Postgres on `5432`.

## Key Endpoints
- `POST /v1/messages` – Ingest user or assistant messages, compute embeddings, persist metadata.
- `GET /v1/memory/search` – Retrieve top-K relevant memories with deterministic scoring.
- `POST /v1/admin/retention/run` – Trigger archival/deletion policies.
- `GET /v1/admin/health` – Report service health and retention job status.

## Architecture Highlights
- **Config-first:** Centralized `Settings` (Pydantic) controlling DB URLs, embedding dimensions, retention policies.
- **Layered services:** Routes call service classes, which orchestrate repositories, embedders, and scorers.
- **Async SQLAlchemy:** Ready for Postgres + pgvector; includes default SQLite fallback for local smoke tests.
- **Extensible scoring:** Importance and retrieval weights are configurable per tenant or deployment.
- **Retention workflow:** Scheduler-friendly service with dry-run support for policy verification.

## Security & Observability
- **API Keys:** Set `MEMORY_API_KEYS` (comma-delimited) to require the `x-api-key` header on every endpoint except health/metrics.
- **Structured Logging:** `structlog` JSON logs with configurable `MEMORY_LOG_LEVEL`.
- **Metrics:** Prometheus-compatible metrics at `/metrics`, automatically instrumented via middleware.
- **Health Endpoint:** `/v1/admin/health` returns status, latency, uptime, version, and environment metadata.

## Development Scripts
- `make format` – Run Ruff formatting.
- `make lint` – Run Ruff + mypy.
- `make test` – Execute pytest suite (unit + integration).
- `alembic upgrade head` – Apply database migrations.

## Next Steps
- Connect to a real Postgres instance with pgvector enabled.
- Build Alembic migrations for the defined ORM models.
- Implement production-ready embedding service integrations (OpenAI, Azure, self-hosted).
- Wire retention scheduler (Celery/Arq/Temporal) to call `RetentionService`.
