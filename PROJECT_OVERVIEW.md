# AI Memory Layer - Project Overview

## 🎯 What This Project Does

A backend service that stores and retrieves conversation memories for AI chatbots. It:
- Stores messages with embeddings (text → numbers)
- Finds relevant past messages when searching
- Automatically archives old/unimportant messages
- Works with any AI system via REST API

---

## 📁 Project Structure

```
src/ai_memory_layer/
├── main.py              # FastAPI app entry point
├── config.py            # Settings (database, API keys, etc.)
├── database.py          # Database connection setup
│
├── routes/              # API ENDPOINTS (HTTP layer)
│   ├── messages.py      # POST /v1/messages (store messages)
│   ├── memory.py        # GET /v1/memory/search (search memories)
│   └── admin.py         # Admin endpoints (health, retention)
│
├── schemas/             # DATA VALIDATION (request/response models)
│   ├── messages.py
│   ├── memory.py
│   └── admin.py
│
├── services/            # BUSINESS LOGIC
│   ├── message_service.py   # Main orchestrator (ingest/retrieve)
│   ├── embedding.py         # Convert text → vector
│   ├── importance.py        # Calculate message importance (0-1)
│   ├── retrieval.py         # Rank memories (similarity + importance)
│   └── retention.py         # Archive/delete old messages
│
├── repositories/        # DATABASE ACCESS (SQL queries)
│   └── memory_repository.py
│
└── models/              # DATABASE TABLES (ORM models)
    └── memory.py        # Message, ArchivedMessage, RetentionPolicy tables

tests/                   # TESTS
├── unit/                # Test individual functions
├── integration/         # Test API endpoints
└── e2e/                 # Test full workflows
```

---

## 🔄 How It Works (Simple Flow)

### 1. Store a Message
```
User sends: POST /v1/messages
  → Route validates request
  → Service creates message in DB
  → Service calculates importance score
  → Service generates embedding (text → vector)
  → Service updates message with embedding
  → Returns message ID
```

### 2. Search Memories
```
User sends: GET /v1/memory/search?query=Python
  → Route validates query
  → Service embeds query text → vector
  → Service fetches candidate messages from DB
  → Service ranks them:
     - Similarity: How similar to query? (60%)
     - Importance: How important? (30%)
     - Decay: How recent? (10%)
  → Returns top 5 most relevant messages
```

### 3. Archive Old Messages
```
Admin sends: POST /v1/admin/retention/run
  → Service finds old/low-importance messages
  → Service moves them to archive table
  → Service deletes very old archived messages
  → Returns counts
```

---

## ✅ What's Implemented

### Core Features
- ✅ **Message Storage**: Store messages with metadata
- ✅ **Embeddings**: Convert text to vectors (mock provider)
- ✅ **Importance Scoring**: Calculate importance (recency + role + explicit)
- ✅ **Memory Search**: Find relevant memories using similarity + importance
- ✅ **Retention**: Archive and delete old messages
- ✅ **Health Check**: `/v1/admin/health` endpoint
- ✅ **Metrics**: Prometheus metrics at `/metrics`

### Infrastructure
- ✅ **FastAPI**: REST API framework
- ✅ **Database Models**: SQLAlchemy ORM models defined
- ✅ **Migrations**: Alembic setup with initial migration
- ✅ **Docker**: Dockerfile + docker-compose.yml
- ✅ **Logging**: Structured logging with structlog
- ✅ **Security**: API key authentication (optional)
- ✅ **Tests**: Unit, integration, and E2E tests

### Code Quality
- ✅ **Type Hints**: Full type coverage
- ✅ **Linting**: Ruff + mypy configured
- ✅ **Async**: All I/O is async
- ✅ **Clean Architecture**: Layered design (routes → services → repositories)

---

## ❌ What's Remaining

### Critical (Must Have)
1. **Real Embedding Provider**
   - Currently uses mock (hash-based)
   - Need: OpenAI or Azure OpenAI integration
   - File: `services/embedding.py`

2. **Production Database Setup**
   - Alembic migrations exist but need to run
   - Need: Connect to real Postgres with pgvector
   - Command: `alembic upgrade head`

3. **Background Jobs**
   - Embedding generation is synchronous (slow)
   - Need: Celery/Arq for async embedding jobs
   - File: `models/memory.py` has `EmbeddingJob` table (unused)

4. **Scheduled Retention**
   - Retention must be triggered manually
   - Need: Cron job or scheduler to run automatically
   - Can use: Celery beat, Kubernetes CronJob, or external scheduler

### Important (Should Have)
5. **More Tests**
   - Current: Basic tests exist
   - Need: Higher coverage, edge cases, load tests

6. **Error Handling**
   - Basic error handling exists
   - Need: Better error messages, retry logic, circuit breakers

7. **Documentation**
   - README exists
   - Need: API examples, deployment guide, architecture docs

8. **Monitoring**
   - Metrics exist
   - Need: Alerting, dashboards, tracing

### Nice to Have
9. **Multi-tenancy**
   - Basic tenant_id support exists
   - Need: Tenant isolation, rate limiting per tenant

10. **Caching**
    - No caching currently
    - Need: Redis for frequent queries

---

## 🧪 How to Test Everything

### 1. Setup Environment

```bash
# Install dependencies
uv sync

# Or with pip
pip install -e .[dev]
```

### 2. Setup Database

**Option A: Docker Compose (Recommended)**
```bash
# Start Postgres + API
docker compose up -d

# Run migrations
docker compose exec api alembic upgrade head
```

**Option B: Local Postgres**
```bash
# Create database
createdb memory_layer

# Set environment
export MEMORY_DATABASE_URL="postgresql+asyncpg://user:pass@localhost/memory_layer"

# Run migrations
alembic upgrade head
```

**Option C: SQLite (Testing Only)**
```bash
# Uses default SQLite (no setup needed)
# Just run: make test
```

### 3. Run Tests

```bash
# Run all tests
make test
# or
pytest

# Run with coverage
pytest --cov=src/ai_memory_layer --cov-report=html

# Run specific test types
pytest tests/unit/              # Unit tests
pytest tests/integration/       # Integration tests
pytest tests/e2e/               # End-to-end tests

# Run with verbose output
pytest -v
```

### 4. Test API Manually

```bash
# Start API
make run
# or
uvicorn ai_memory_layer.main:app --reload

# Visit API docs
open http://localhost:8000/docs

# Test endpoints:
# 1. Store message
curl -X POST http://localhost:8000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test",
    "conversation_id": "conv-1",
    "role": "user",
    "content": "I love Python programming"
  }'

# 2. Search memories
curl "http://localhost:8000/v1/memory/search?tenant_id=test&query=Python&top_k=5"

# 3. Health check
curl http://localhost:8000/v1/admin/health

# 4. Metrics
curl http://localhost:8000/metrics
```

### 5. Test with Docker

```bash
# Build and run
docker compose up --build

# Test API
curl http://localhost:8000/v1/admin/health

# View logs
docker compose logs -f api

# Stop
docker compose down
```

### 6. Pre-Deployment Checklist

```bash
# ✅ Code quality
make lint              # Check for errors
make format            # Auto-format code

# ✅ Tests pass
make test              # All tests green

# ✅ Database migrations
alembic upgrade head   # Migrations applied

# ✅ Environment variables set
# Check .env file has:
# - MEMORY_DATABASE_URL
# - MEMORY_EMBEDDING_PROVIDER (if using real provider)
# - MEMORY_API_KEYS (if using auth)

# ✅ Health check works
curl http://localhost:8000/v1/admin/health

# ✅ Metrics work
curl http://localhost:8000/metrics
```

---

## 🚀 Deployment Steps

### 1. Prepare Environment
```bash
# Set production database URL
export MEMORY_DATABASE_URL="postgresql+asyncpg://user:pass@prod-db/memory_layer"

# Set embedding provider
export MEMORY_EMBEDDING_PROVIDER="openai"  # or "azure_openai"
export OPENAI_API_KEY="sk-..."  # if using OpenAI

# Set API keys (comma-separated)
export MEMORY_API_KEYS="key1,key2,key3"
```

### 2. Run Migrations
```bash
alembic upgrade head
```

### 3. Deploy
```bash
# Using Docker
docker build -t ai-memory-layer .
docker run -p 8000:8000 --env-file .env ai-memory-layer

# Or using Docker Compose
docker compose -f docker-compose.prod.yml up -d
```

### 4. Verify
```bash
# Health check
curl http://your-server:8000/v1/admin/health

# Test endpoint
curl -X POST http://your-server:8000/v1/messages \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## 📊 Current Status

**Completion: ~75%**

- ✅ Core functionality: **100%**
- ✅ Infrastructure: **90%**
- ⚠️ Production readiness: **60%**
- ⚠️ Testing: **70%**
- ❌ Background jobs: **0%**
- ❌ Real embeddings: **0%**

**Next Priority**: Implement real embedding provider (OpenAI/Azure) and background job system.

---

## 🔗 Key Files to Know

- `main.py` - Start here, app entry point
- `routes/messages.py` - API endpoints
- `services/message_service.py` - Main business logic
- `repositories/memory_repository.py` - Database queries
- `config.py` - All configuration
- `docker-compose.yml` - Local development setup

---

## 💡 Quick Commands Reference

```bash
# Development
make run              # Start API
make test             # Run tests
make lint             # Check code
make format           # Format code

# Database
alembic upgrade head  # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration

# Docker
docker compose up     # Start services
docker compose down   # Stop services
docker compose logs   # View logs
```

