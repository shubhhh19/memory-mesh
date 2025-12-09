# memory mesh

Backend service for storing and retrieving conversation messages with semantic search. Handles embeddings, importance scoring, and automatic retention policies.

## What It Does

memorymesh stores conversation messages and lets you search through them using semantic similarity. It generates embeddings for messages, scores them by importance, and can automatically archive or delete old messages based on configurable policies.

The service exposes a REST API that your applications can call to store messages and search through past conversations. It's designed to work as a separate service that you deploy and connect to from your main application.

## Features

- Store conversation messages with automatic embedding generation
- Semantic search using vector similarity
- Importance scoring based on recency, role, and explicit importance
- Automatic retention policies for archiving and deleting old messages
- Rate limiting with Redis backend
- Support for multiple embedding providers (Google Gemini, Sentence Transformers)
- Background job queue for async embedding generation
- Prometheus metrics endpoint
- Multi-tenant data isolation

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- PostgreSQL with pgvector extension (SQLite supported for development)
- Redis for caching and rate limiting
- SQLAlchemy async ORM
- Alembic for database migrations

**Infrastructure:**
- Docker and Docker Compose
- Prometheus for metrics
- Grafana dashboards included
- Structured JSON logging

## Installation

### Prerequisites

- Python 3.11 or higher
- PostgreSQL with pgvector extension (or SQLite for local development)
- Redis (optional, but required for rate limiting and caching)
- Google Gemini API key (if using Gemini embeddings)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/shubhhh19/memory-layer.git
cd memory-layer
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -e ".[dev]"
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set at minimum:
- `MEMORY_DATABASE_URL` - PostgreSQL connection string
- `MEMORY_API_KEYS` - Comma-separated list of API keys for authentication
- `MEMORY_GEMINI_API_KEY` - If using Google Gemini embeddings
- `MEMORY_REDIS_URL` - Redis connection string (required for rate limiting)

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the service:
```bash
# Using Docker Compose
docker compose up --build

# Or locally
uvicorn ai_memory_layer.main:app --reload
```

The API will be available at http://localhost:8000. Interactive API documentation is at http://localhost:8000/docs.

## Quick Start

### Store a Message

```bash
curl -X POST http://localhost:8000/v1/messages \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "my-app",
    "conversation_id": "user-123",
    "role": "user",
    "content": "I need help with Python"
  }'
```

### Search Messages

```bash
curl "http://localhost:8000/v1/memory/search?tenant_id=my-app&query=Python&top_k=5" \
  -H "x-api-key: your-api-key"
```

### Check Health

```bash
curl http://localhost:8000/v1/admin/health
```

## API Overview

The service exposes these main endpoints:

- `POST /v1/messages` - Store a new message
- `GET /v1/messages/{message_id}` - Retrieve a message by ID
- `GET /v1/memory/search` - Search for relevant messages
- `GET /v1/admin/health` - Health check endpoint
- `GET /v1/admin/readiness` - Readiness probe
- `POST /v1/admin/retention/run` - Manually trigger retention policies

All endpoints except health and readiness require an API key in the `x-api-key` header.

See [INTEGRATION.md](INTEGRATION.md) for detailed integration examples and client code in Python, JavaScript, and Go.

## Configuration

Key environment variables:

**Database:**
```
MEMORY_DATABASE_URL=postgresql+asyncpg://user:pass@localhost/memory_layer
```

**Authentication:**
```
MEMORY_API_KEYS=key1,key2,key3
```

**Embeddings:**
```
MEMORY_EMBEDDING_PROVIDER=google_gemini
MEMORY_GEMINI_API_KEY=your-key-here
MEMORY_EMBEDDING_DIMENSIONS=768
```

**Redis (for rate limiting and caching):**
```
MEMORY_REDIS_URL=redis://localhost:6379/0
```

**Rate Limiting:**
```
MEMORY_GLOBAL_RATE_LIMIT=200/minute
MEMORY_TENANT_RATE_LIMIT=120/minute
```

**Retention:**
```
MEMORY_RETENTION_MAX_AGE_DAYS=30
MEMORY_RETENTION_IMPORTANCE_THRESHOLD=0.35
MEMORY_RETENTION_SCHEDULE_SECONDS=86400
```

See the `.env.example` file for all available configuration options.

## Architecture

The service is structured as a standard FastAPI application:

- Routes handle HTTP requests and validation
- Services contain business logic (message ingestion, retrieval, retention)
- Repositories handle database access
- Models define the database schema

Embeddings are generated either inline (synchronous) or via a background job queue (asynchronous). The job queue can run in-process or as a separate worker process.

Search uses pgvector for vector similarity when available, with a fallback to SQLite for local development. Results are ranked by combining similarity scores, importance scores, and temporal decay.

## Development

### Running Tests

```bash
# All tests
pytest

# Unit tests only
pytest tests/unit/

# Integration tests
pytest tests/integration/

# With coverage
pytest --cov=src/ai_memory_layer --cov-report=html
```

### Code Quality

```bash
# Format code
ruff check --select I --fix .

# Lint
ruff check .

# Type checking
mypy src
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

The service is containerized and can be deployed using Docker Compose or Kubernetes. The Dockerfile creates a non-root user and includes all dependencies.

For production deployments:
- Use PostgreSQL with pgvector extension
- Configure Redis for rate limiting and caching
- Set up proper API keys
- Configure monitoring (Prometheus metrics are exposed at `/metrics`)
- Set up log aggregation for structured JSON logs

## Monitoring

The service exposes Prometheus metrics at `/metrics`. Included metrics:
- HTTP request counts and latency
- Message ingestion counts
- Search operation counts and durations
- Embedding job durations
- Rate limit hits

Grafana dashboard configuration is included in `docs/monitoring/`.

## How It Works

When you store a message:
1. The message is saved to the database
2. An embedding is generated (inline or queued for background processing)
3. An importance score is calculated based on recency, role, and any explicit importance override
4. The message becomes searchable once the embedding is complete

When you search:
1. An embedding is generated for your query
2. Vector similarity search finds candidate messages
3. Results are ranked by combining similarity, importance, and temporal decay
4. Top-k results are returned

Retention policies run on a schedule (default daily) and archive or delete messages based on age and importance thresholds.

## Limitations

- Vector search requires pgvector for best performance. SQLite fallback works but is slower.
- Rate limiting requires Redis. Without Redis, rate limiting won't work.
- Embedding generation can be slow with large messages or high throughput. Use async mode for better performance.
- The service doesn't handle message updates or deletions directly - use retention policies for cleanup.

## License

MIT

## Author

Shubh Soni
- GitHub: [@shubhhh19](https://github.com/shubhhh19)
- Email: sonishubh2004@gmail.com
