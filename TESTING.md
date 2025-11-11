# Testing Guide for AI Memory Layer

## Quick Start

```bash
# Install dependencies (including dev tools)
uv sync

# Run all tests
make test
# or
pytest

# Run with coverage
pytest --cov=src/ai_memory_layer --cov-report=html

# Run specific test file
pytest tests/test_importance.py

# Run with verbose output
pytest -v
```

## Test Structure

### Current Test Setup
- **Framework**: pytest with pytest-asyncio
- **Location**: `tests/` directory
- **Example**: `test_importance.py` demonstrates unit testing for services

### Recommended Test Organization

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures (DB sessions, test clients, etc.)
├── unit/
│   ├── test_services/
│   │   ├── test_importance.py
│   │   ├── test_embedding.py
│   │   ├── test_retrieval.py
│   │   └── test_retention.py
│   └── test_models/
│       └── test_memory.py
├── integration/
│   ├── test_api/
│   │   ├── test_messages.py
│   │   ├── test_memory_search.py
│   │   └── test_admin.py
│   └── test_database/
│       └── test_repositories.py
└── e2e/
    └── test_workflows.py
```

## Testing Strategies

### 1. Unit Tests
Test individual components in isolation:

```python
# Example: tests/unit/test_services/test_importance.py
def test_importance_scorer_with_explicit_importance():
    scorer = ImportanceScorer()
    now = datetime.now(timezone.utc)
    score = scorer.score(
        created_at=now,
        role="user",
        explicit_importance=0.9
    )
    assert 0.0 <= score <= 1.0
    assert score > 0.5  # High explicit importance should boost score
```

### 2. Integration Tests
Test API endpoints with test database:

```python
# Example: tests/integration/test_api/test_messages.py
import pytest
from httpx import AsyncClient
from ai_memory_layer.main import app

@pytest.mark.asyncio
async def test_create_message():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/v1/messages", json={
            "content": "Hello",
            "role": "user",
            "session_id": "test-session"
        })
        assert response.status_code == 202
        data = response.json()
        assert "id" in data
        assert data["content"] == "Hello"
```

### 3. Database Tests
Use in-memory SQLite or test Postgres:

```python
# In conftest.py
@pytest.fixture
async def test_db():
    # Use in-memory SQLite for fast tests
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()
```

## Essential Test Fixtures (conftest.py)

Create `tests/conftest.py`:

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from ai_memory_layer.database import Base, get_session
from ai_memory_layer.main import app

@pytest.fixture
async def test_engine():
    """In-memory SQLite engine for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest.fixture
async def test_session(test_engine):
    """Test database session."""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

@pytest.fixture
async def client(test_session):
    """FastAPI test client with overridden DB dependency."""
    async def override_get_session():
        yield test_session
    
    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

## Testing Checklist

### Service Layer
- [ ] Importance scoring with various inputs
- [ ] Embedding service (mock and real providers)
- [ ] Retrieval service with similarity search
- [ ] Retention service with dry-run mode
- [ ] Message service orchestration

### API Layer
- [ ] POST /v1/messages - message ingestion
- [ ] GET /v1/messages/{id} - message retrieval
- [ ] GET /v1/memory/search - memory search
- [ ] POST /v1/admin/retention/run - retention job
- [ ] GET /v1/admin/health - health check
- [ ] Error handling (404, 400, 500)

### Repository Layer
- [ ] CRUD operations
- [ ] Vector similarity queries
- [ ] Transaction handling
- [ ] Query optimization

### Edge Cases
- [ ] Empty search results
- [ ] Invalid UUIDs
- [ ] Large batch operations
- [ ] Concurrent requests
- [ ] Database connection failures

## Running Tests in CI/CD

Add to `.github/workflows/test.yml` or similar:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: uv sync
      - run: make lint
      - run: make test
      - run: pytest --cov --cov-report=xml
```

## Performance Testing

For load testing (optional):

```bash
# Install locust
pip install locust

# Create locustfile.py
# Run: locust -f locustfile.py
```

## Test Database Setup

For integration tests requiring Postgres:

```bash
# Using Docker
docker run -d \
  --name test-postgres \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=memory_test \
  -p 5433:5432 \
  pgvector/pgvector:pg16

# Set test database URL
export MEMORY_DATABASE_URL=postgresql+asyncpg://postgres:test@localhost:5433/memory_test
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Fixtures**: Use fixtures for common setup (DB, clients)
3. **Async**: Use `pytest.mark.asyncio` for async tests
4. **Mocking**: Mock external services (embedding APIs)
5. **Coverage**: Aim for >80% code coverage
6. **Fast**: Unit tests should run in <1s total
7. **Clear**: Test names should describe what they test

## Common Commands

```bash
# Run tests with output
pytest -v -s

# Run only failed tests
pytest --lf

# Run tests matching pattern
pytest -k "test_importance"

# Run with coverage report
pytest --cov=src/ai_memory_layer --cov-report=term-missing

# Run specific test
pytest tests/test_importance.py::test_importance_scoring_respects_recency_and_role
```

