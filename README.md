# AI Memory Layer

<div align="center">

<img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
<img src="https://img.shields.io/badge/version-1.0-orange" alt="Version" />

_A production-ready backend service for AI chatbot conversation memory with semantic search, importance scoring, and automatic retention policies_

</div>

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Screenshots](#screenshots)
- [Interesting Parts During Build](#interesting-parts-during-build)
- [Challenges and Solutions](#challenges-and-solutions)
- [Future Updates](#future-updates)
- [Author](#author)
- [License](#license)

## Features

- **Semantic Search**: Find relevant past messages using vector embeddings
- **Importance Scoring**: Automatically prioritize messages by recency, role, and explicit importance
- **Smart Retention**: Archive/delete old messages based on age and importance
- **Rate Limiting**: Protect your API with built-in rate limiting
- **Real Embeddings**: Google Gemini API integration for production-quality embeddings
- **Background Processing**: Async embedding generation with job queue
- **Monitoring**: Prometheus metrics and Grafana dashboards
- **Multi-tenant Support**: Isolated data per tenant

## Technology Stack

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL with pgvector extension (or SQLite for development)
- Redis (for caching and rate limiting)
- Google Gemini API
- SQLAlchemy (async ORM)
- Alembic (database migrations)

### Infrastructure
- Docker & Docker Compose
- Prometheus & Grafana (monitoring)
- Structured logging (structlog)

## Installation

1. Clone the repository:
```bash
git clone <your-repo>
cd memory-layer
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -e ".[dev]"
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
alembic upgrade head
```

6. Run the application:
```bash
# Option 1: Using Docker Compose (Recommended)
docker compose up --build
docker compose exec api alembic upgrade head

# Option 2: Local Development
uvicorn ai_memory_layer.main:app --reload
```

The API will be available at http://localhost:8000
API docs at http://localhost:8000/docs

## Integration

See [INTEGRATION.md](INTEGRATION.md) for detailed integration examples in Python, JavaScript, Go, and more.

**Quick Example (Python):**
```python
import requests

headers = {
    "x-api-key": "your-api-key",
    "Content-Type": "application/json"
}

# Store a message
response = requests.post(
    "http://localhost:8000/v1/messages",
    headers=headers,
    json={
    "tenant_id": "my-app",
        "conversation_id": "user-123",
    "role": "user",
    "content": "I love Python programming"
    }
)

# Search memories
response = requests.get(
    "http://localhost:8000/v1/memory/search",
    headers=headers,
    params={
        "tenant_id": "my-app",
        "query": "Python",
        "top_k": 5
    }
)
```

## Screenshots

_Add screenshots of your API documentation, monitoring dashboards, or example responses here_

## Interesting Parts During Build

1. **Semantic Search Implementation**
   - Implemented vector similarity search using pgvector extension
   - Developed fallback mechanism for SQLite development environments
   - Created hybrid ranking system combining similarity and importance scores

2. **Embedding Service Architecture**
   - Built pluggable embedding provider system (Google Gemini, Sentence Transformers, Mock)
   - Implemented circuit breaker pattern for resilience
   - Added async job queue for background embedding generation

3. **Retention System**
   - Developed automatic retention policies based on age and importance
   - Implemented scheduled background jobs for cleanup
   - Created archive/delete workflow with configurable thresholds

4. **Rate Limiting**
   - Built Redis-backed rate limiting with global and per-tenant limits
   - Implemented async rate limit checking to avoid blocking
   - Added configurable rate limit strategies

## Challenges and Solutions

1. **Challenge**: Vector search performance with large datasets
   - **Solution**: Implemented candidate limiting and hybrid ranking to balance speed and relevance
   - Added database indexes on tenant_id, conversation_id, and importance_score

2. **Challenge**: Embedding generation latency
   - **Solution**: Built async job queue system for background processing
   - Implemented caching layer for frequently accessed embeddings
   - Added circuit breaker to fallback to mock embeddings on failures

3. **Challenge**: Multi-database compatibility
   - **Solution**: Created abstraction layer for vector operations
   - Implemented SQLite fallback for development without pgvector dependency
   - Used Alembic migrations with conditional logic for different databases

4. **Challenge**: Rate limiting at scale
   - **Solution**: Used Redis for distributed rate limiting
   - Implemented async rate limit checks to avoid blocking request handling
   - Added separate limits for global and per-tenant traffic

## Future Updates

1. **Planned Features**
   - Additional embedding providers (OpenAI, Cohere)
   - GraphQL API endpoint
   - Webhook notifications for retention events
   - Advanced analytics dashboard

2. **Planned Improvements**
   - Enhanced search filters (date ranges, metadata queries)
   - Batch message ingestion API
   - Export/import functionality
   - Multi-region deployment support

## Author

**Shubh Soni**
- GitHub: [@shubhhh19](https://github.com/shubhhh19)
- Email: sonishubh2004@gmail.com

## License

MIT
