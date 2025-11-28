# AI Memory Layer

**Production-ready backend service for AI chatbot conversation memory with semantic search, importance scoring, and automatic retention policies.**

## 🎯 What This Does

Stores and retrieves conversation memories for AI systems using:
- **Semantic Search**: Find relevant past messages using vector embeddings
- **Importance Scoring**: Automatically prioritize messages by recency, role, and explicit importance
- **Smart Retention**: Archive/delete old messages based on age and importance
- **Rate Limiting**: Protect your API with built-in rate limiting
- **Real Embeddings**: Google Gemini API integration for production-quality embeddings

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL with pgvector extension (or SQLite for testing)
- Google Gemini API key (free tier available)

### Installation

```bash
# Clone the repository
git clone <your-repo>
cd memory-layer

# Install dependencies
pip install -e ".[dev]"

# Copy environment template
cp .env.example .env

# Edit .env and add your Gemini API key
# MEMORY_GEMINI_API_KEY=your-key-here
# MEMORY_EMBEDDING_PROVIDER=google_gemini
```

### Run Locally

```bash
# Option 1: Using Docker Compose (Recommended)
docker compose up --build
docker compose exec api alembic upgrade head

# Option 2: Local Development
alembic upgrade head
uvicorn ai_memory_layer.main:app --reload

# API will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

## 📖 How It Works

### 1. Store a Message
```bash
curl -X POST http://localhost:8000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "my-app",
    "conversation_id": "conv-123",
    "role": "user",
    "content": "I love Python programming"
  }'
```

### 2. Search Memories
```bash
curl "http://localhost:8000/v1/memory/search?tenant_id=my-app&query=Python&top_k=5"
```

### 3. Check Health
```bash
curl http://localhost:8000/v1/admin/health
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
pytest --cov=src/ai_memory_layer --cov-report=html

# Run specific test types
pytest tests/unit/              # Unit tests
pytest tests/integration/       # Integration tests
pytest tests/e2e/               # End-to-end tests
```

## 🏗️ Architecture

```
Client → FastAPI → Services → Repositories → Database
                ↓
         Embedding Service (Google Gemini)
```

**Key Components:**
- **Routes**: API endpoints (`/v1/messages`, `/v1/memory/search`)
- **Services**: Business logic (message ingestion, retrieval, retention)
- **Repositories**: Database access layer
- **Models**: SQLAlchemy ORM models

## 📊 Current Status

✅ **Implemented:**
- Message storage with embeddings
- Semantic search with similarity ranking
- Importance scoring (recency + role + explicit)
- Retention policies (archive/delete)
- Google Gemini embedding integration
- Rate limiting (global)
- CORS configuration
- Health checks & metrics
- API key authentication
- Comprehensive test suite

⚠️ **Remaining for Full Production:**
- Fix database session context manager issue in search
- Implement per-tenant rate limiting
- Add background job queue for async embeddings
- Set up monitoring/alerting
- Load testing

## 🔧 Configuration

Key environment variables (see `.env.example`):

```bash
# Database
MEMORY_DATABASE_URL=postgresql+asyncpg://user:pass@localhost/memory_layer

# Embeddings
MEMORY_EMBEDDING_PROVIDER=google_gemini  # or sentence_transformer, mock
MEMORY_GEMINI_API_KEY=your-api-key-here
MEMORY_EMBEDDING_DIMENSIONS=768  # Gemini embedding-001 default

# Security
MEMORY_API_KEYS=key1,key2,key3  # Comma-separated
MEMORY_ALLOWED_ORIGINS=*  # Or specific domains

# Rate Limiting
MEMORY_GLOBAL_RATE_LIMIT=200/minute
```

## 📚 API Reference

### POST /v1/messages
Store a new message with automatic embedding generation.

**Request:**
```json
{
  "tenant_id": "string",
  "conversation_id": "string",
  "role": "user|assistant|system",
  "content": "string",
  "metadata": {},
  "importance_override": 0.8
}
```

**Response:** `202 Accepted`

### GET /v1/memory/search
Search for relevant memories.

**Query Parameters:**
- `tenant_id` (required)
- `query` (required)
- `conversation_id` (optional)
- `top_k` (default: 5)
- `importance_min` (optional)

**Response:**
```json
{
  "total": 5,
  "items": [{
    "message_id": "uuid",
    "score": 0.85,
    "similarity": 0.92,
    "content": "...",
    "importance": 0.72
  }]
}
```

### GET /v1/admin/health
Health check endpoint.

### POST /v1/admin/retention/run
Manually trigger retention job.

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment guide.

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read contributing guidelines first.
