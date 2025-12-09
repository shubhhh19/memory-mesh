# Memory Mesh

A production-ready semantic memory layer for AI applications. Store, search, and manage conversational memories with vector embeddings, importance scoring, and automated retention policies.

## Overview

Memory Mesh provides a REST API for storing conversation messages and searching through them using semantic similarity. It generates embeddings for messages, scores them by importance, and automatically manages message lifecycle through configurable retention policies.

The service is designed as a separate microservice that you deploy and connect to from your main application. It supports multiple embedding providers, real-time updates via WebSockets, and includes a complete authentication system with JWT tokens and API keys.

## Features

- Semantic search using vector similarity with pgvector
- Automatic embedding generation with multiple provider support
- Importance scoring based on recency, role, and explicit importance
- Automated retention policies for archiving and deleting messages
- Multi-tenant data isolation
- JWT-based authentication with user management
- API key management for programmatic access
- Conversation management with statistics and pagination
- Real-time updates via WebSockets
- Batch message operations for efficient processing
- Analytics and usage statistics
- Rate limiting with Redis backend
- Background job queue for async embedding generation
- Prometheus metrics endpoint
- Distributed tracing with OpenTelemetry
- API versioning with deprecation support

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI for REST API
- PostgreSQL with pgvector extension (SQLite supported for development)
- Redis for caching and rate limiting
- SQLAlchemy async ORM
- Alembic for database migrations
- JWT authentication with python-jose
- WebSockets for real-time features

**Frontend:**
- Next.js 15 with React 19
- TypeScript for type safety
- Tailwind CSS for styling
- React Hot Toast for notifications
- Crypto-js for secure token storage

**Infrastructure:**
- Docker and Docker Compose
- Prometheus for metrics
- Grafana dashboards
- Structured JSON logging
- GitHub Actions for CI/CD

## Installation

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 14+ with pgvector extension (or SQLite for local development)
- Redis (optional, but required for rate limiting and caching)
- Node.js 18+ (for frontend)
- Google Gemini API key (if using Gemini embeddings)

### Backend Setup

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
- `MEMORY_JWT_SECRET_KEY` - Secure random key for JWT tokens (generate with: `python -c 'import secrets; print(secrets.token_urlsafe(32))'`)
- `MEMORY_ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
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

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000.

## Quick Start

### Register a User

```bash
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "SecurePass123"
  }'
```

### Login and Get Token

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Store a Message

```bash
curl -X POST http://localhost:8000/v1/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "my-app",
    "conversation_id": "user-123",
    "role": "user",
    "content": "I need help with Python programming"
  }'
```

### Search Messages

```bash
curl "http://localhost:8000/v1/memory/search?tenant_id=my-app&query=Python&top_k=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Check Health

```bash
curl http://localhost:8000/v1/admin/health
```

## API Overview

The service exposes these main endpoints:

**Authentication:**
- `POST /v1/auth/register` - Register a new user
- `POST /v1/auth/login` - Login and get JWT tokens
- `POST /v1/auth/refresh` - Refresh access token
- `GET /v1/auth/me` - Get current user information
- `POST /v1/auth/api-keys` - Create API key
- `GET /v1/auth/api-keys` - List API keys

**Messages:**
- `POST /v1/messages` - Store a new message
- `GET /v1/messages/{message_id}` - Retrieve a message by ID
- `PUT /v1/messages/{message_id}` - Update a message
- `DELETE /v1/messages/{message_id}` - Delete a message
- `POST /v1/messages/batch` - Batch create messages
- `PUT /v1/messages/batch/update` - Batch update messages
- `DELETE /v1/messages/batch` - Batch delete messages

**Search:**
- `GET /v1/memory/search` - Search for relevant messages

**Conversations:**
- `GET /v1/conversations` - List conversations
- `POST /v1/conversations` - Create a conversation
- `GET /v1/conversations/{conversation_id}` - Get conversation details
- `PUT /v1/conversations/{conversation_id}` - Update conversation
- `DELETE /v1/conversations/{conversation_id}` - Delete conversation
- `GET /v1/conversations/{conversation_id}/stats` - Get conversation statistics

**Analytics:**
- `GET /v1/analytics/usage` - Get usage statistics
- `GET /v1/analytics/trends` - Get usage trends
- `GET /v1/analytics/top-conversations` - Get top conversations
- `GET /v1/analytics/embedding-stats` - Get embedding statistics

**WebSockets:**
- `WS /ws/messages/{tenant_id}` - Real-time message updates
- `WS /ws/stream/{tenant_id}` - Streaming search results

**Admin:**
- `GET /v1/admin/health` - Health check endpoint
- `GET /v1/admin/readiness` - Readiness probe
- `POST /v1/admin/retention/run` - Manually trigger retention policies

All endpoints except health and readiness require authentication via JWT token in the `Authorization: Bearer` header or API key in the `x-api-key` header.

See [INTEGRATION.md](INTEGRATION.md) for detailed integration examples and client code in Python, JavaScript, and Go.

## Configuration

Key environment variables:

**Database:**
```
MEMORY_DATABASE_URL=postgresql+asyncpg://user:pass@localhost/memory_layer
```

**Authentication:**
```
MEMORY_JWT_SECRET_KEY=your-secure-random-key-here
MEMORY_ACCESS_TOKEN_EXPIRE_MINUTES=30
MEMORY_REFRESH_TOKEN_EXPIRE_DAYS=7
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

**CORS:**
```
MEMORY_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

See the `.env.example` file for all available configuration options.

## Architecture

The service follows a layered architecture:

- **Routes** handle HTTP requests, validation, and authentication
- **Services** contain business logic (message ingestion, retrieval, retention, authentication)
- **Repositories** handle database access and queries
- **Models** define the database schema using SQLAlchemy ORM
- **Schemas** define Pydantic models for request/response validation

Embeddings are generated either inline (synchronous) or via a background job queue (asynchronous). The job queue can run in-process or as a separate worker process.

Search uses pgvector for vector similarity when available, with a fallback to SQLite for local development. Results are ranked by combining similarity scores, importance scores, and temporal decay.

Authentication supports both JWT tokens for user sessions and API keys for programmatic access. User management includes roles, tenant isolation, and session tracking.

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
- Set secure JWT secret key (minimum 32 characters)
- Configure CORS with specific origins (no wildcards)
- Set up monitoring (Prometheus metrics are exposed at `/metrics`)
- Set up log aggregation for structured JSON logs
- Use HTTPS with proper SSL certificates
- Configure rate limiting appropriately for your use case

See [README_PRODUCTION.md](README_PRODUCTION.md) for detailed production deployment instructions.

## Monitoring

The service exposes Prometheus metrics at `/metrics`. Included metrics:
- HTTP request counts and latency
- Message ingestion counts
- Search operation counts and durations
- Embedding job durations
- Rate limit hits
- Authentication attempts
- WebSocket connections

Grafana dashboard configuration is included in `docs/monitoring/`.

## How It Works

When you store a message:
1. The message is validated and saved to the database
2. An embedding is generated (inline or queued for background processing)
3. An importance score is calculated based on recency, role, and any explicit importance override
4. The message becomes searchable once the embedding is complete

When you search:
1. An embedding is generated for your query
2. Vector similarity search finds candidate messages using pgvector
3. Results are ranked by combining similarity, importance, and temporal decay
4. Top-k results are returned with scores

Retention policies run on a schedule (default daily) and archive or delete messages based on age and importance thresholds. Advanced retention rules allow for complex conditions and custom actions.

## Interesting Parts During the Build

Building Memory Mesh involved several interesting technical challenges and design decisions.

The vector search implementation required careful consideration of database compatibility. PostgreSQL with pgvector provides excellent performance, but we needed a fallback for development environments. The SQLite fallback uses a different approach, calculating cosine similarity in Python rather than at the database level. This trade-off allows developers to work locally without PostgreSQL while maintaining production performance.

The importance scoring system combines multiple factors: recency decay, role-based weights, and explicit importance overrides. The challenge was creating a formula that produces meaningful scores across different conversation types. We experimented with exponential decay functions and weighted averages before settling on the current approach.

The authentication system supports both JWT tokens and API keys, each serving different use cases. JWT tokens work well for user-facing applications with session management, while API keys are better for server-to-server communication. Implementing both required careful design to avoid code duplication while maintaining security.

The WebSocket implementation for real-time updates required handling connection management, tenant isolation, and graceful disconnections. The connection manager tracks active connections per tenant and efficiently broadcasts messages without blocking.

The retention system started simple but evolved into a rule-based engine supporting multiple rule types, conditions, and actions. This flexibility allows users to create complex retention policies while keeping the default behavior simple.

## Challenges and Solutions

One major challenge was handling database migrations across different database backends. PostgreSQL supports UUID types and ENUMs natively, while SQLite requires string representations. The Alembic migrations needed conditional logic to handle both cases. We solved this by checking the database dialect and applying appropriate column types.

Another challenge was the N+1 query problem in batch operations and analytics endpoints. Initial implementations fetched related data in loops, causing performance issues. We refactored these to use single queries with joins or bulk operations, significantly improving performance.

The frontend encryption for token storage presented a security challenge. Client-side encryption is inherently limited since the key must be accessible to JavaScript. We implemented session-based key storage and documented the limitations, recommending httpOnly cookies for production deployments where possible.

CORS configuration needed careful handling to prevent security issues in production. We implemented validation that prevents wildcard origins in production environments, forcing explicit origin configuration.

The embedding service needed to support multiple providers with a consistent interface. We used Python protocols to define the interface and implemented provider-specific services. The circuit breaker pattern prevents cascading failures when external services are unavailable.

Rate limiting required Redis for distributed systems but needed to work without Redis for local development. We implemented an in-memory rate limiter as a fallback, with clear warnings about its limitations.

## Future Updates

Planned improvements and features for future releases:

**Performance:**
- Implement connection pooling optimizations for high-concurrency scenarios
- Add caching layer for frequently accessed conversations
- Optimize embedding generation with batch processing
- Implement read replicas for scaling search operations

**Features:**
- Message threading and reply chains
- Advanced search filters (date ranges, role filters, metadata queries)
- Export functionality for conversations and analytics
- Webhook support for real-time notifications
- GraphQL API option alongside REST
- Multi-language support in the frontend
- Saved searches and bookmarks
- Data visualization dashboards

**Infrastructure:**
- Kubernetes Helm charts for easier deployment
- Terraform modules for cloud infrastructure
- Enhanced monitoring with custom dashboards
- Automated backup and restore procedures
- Disaster recovery documentation

**Developer Experience:**
- SDK libraries for additional languages (Go, Ruby, PHP)
- Enhanced API documentation with examples
- Interactive API explorer in the frontend
- Local development improvements with Docker Compose
- Better error messages and debugging tools

**Security:**
- OAuth2 integration for third-party authentication
- Two-factor authentication support
- Audit logging for security events
- Enhanced rate limiting with per-endpoint limits
- Content Security Policy implementation

**Analytics:**
- Advanced analytics with custom date ranges
- Export analytics data in multiple formats
- Custom dashboard creation
- Alerting based on usage patterns

## Limitations

- Vector search requires pgvector for best performance. SQLite fallback works but is slower and doesn't support true vector operations.
- Rate limiting requires Redis for distributed systems. Without Redis, rate limiting uses in-memory storage and won't work across multiple instances.
- Embedding generation can be slow with large messages or high throughput. Use async mode for better performance.
- The service doesn't handle message updates or deletions directly in some cases - use retention policies for cleanup.
- Client-side encryption in the frontend provides obfuscation only, not true security. For production, consider httpOnly cookies or server-side session management.

## License

MIT

## Author

Shubh Soni
- GitHub: [@shubhhh19](https://github.com/shubhhh19)
- Email: sonishubh2004@gmail.com
- Website: https://shubhsoni.com/
