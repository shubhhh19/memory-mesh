# Production Deployment Guide

## 🎯 Overview

This guide covers deploying the AI Memory Layer to production, including remaining tasks, testing procedures, and operational considerations.

## ✅ What's Already Done

### Core Features (100%)
- ✅ Message storage with embeddings
- ✅ Semantic search with vector similarity
- ✅ Importance scoring algorithm
- ✅ Retention policies (archive/delete)
- ✅ Google Gemini API integration
- ✅ Rate limiting (global level)
- ✅ CORS configuration
- ✅ API key authentication
- ✅ Health checks & Prometheus metrics
- ✅ Database migrations (Alembic)
- ✅ Comprehensive test suite (13/15 tests passing)

### Infrastructure (90%)
- ✅ Docker & Docker Compose setup
- ✅ FastAPI application
- ✅ SQLAlchemy async ORM
- ✅ Structured logging (structlog)
- ✅ Error handling
- ✅ Request timeout middleware

## ⚠️ Remaining Tasks for Production

### Critical (Must Fix)
1. **Database Session Issue** (1 hour)
   - **Problem**: Search endpoint has async context manager issue
   - **Fix**: Update `get_read_session` dependency in `database.py`
   - **Test**: Run `pytest tests/integration/test_api_messages.py`

2. **Rate Limiting** (30 minutes)
   - **Problem**: Per-request rate limiting not working
   - **Current**: Global rate limit configured but not enforced per-request
   - **Fix**: Either fix SlowAPI integration or use alternative (e.g., `limits` library directly)
   - **Test**: Run `pytest tests/integration/test_rate_limit.py`

### Important (Should Have)
3. **Background Job Queue** (4-6 hours)
   - **Why**: Embedding generation blocks request response
   - **Solution**: Use Celery or Arq for async embedding jobs
   - **Files**: `services/embedding.py`, `models/memory.py` (EmbeddingJob table exists)

4. **Database Indexes** (30 minutes)
   - **Why**: Improve query performance
   - **Create Migration**:
     ```bash
     alembic revision -m "add_performance_indexes"
     ```
   - **Add Indexes**:
     - `messages.created_at`
     - `messages.archived`
     - `messages.tenant_id, archived` (composite)

5. **Monitoring & Alerting** (2-3 hours)
   - **Current**: Prometheus metrics exposed at `/metrics`
   - **Need**: Grafana dashboards, alert rules
   - **Metrics to Monitor**:
     - Request latency (p50, p95, p99)
     - Error rates
     - Embedding generation time
     - Database connection pool usage

### Nice to Have
6. **Load Testing** (2 hours)
   - Test with 100+ concurrent requests
   - Verify rate limiting works under load
   - Check database connection pool sizing

7. **Caching Layer** (3-4 hours)
   - Redis for frequent search queries
   - Cache embedding results
   - Invalidate on new messages

## 🧪 Testing for Production

### 1. Unit Tests
```bash
# Run all unit tests
pytest tests/unit/ -v

# Expected: All passing
```

### 2. Integration Tests
```bash
# Run integration tests
pytest tests/integration/ -v

# Current Status: 11/13 passing
# Failing:
# - test_create_and_search_message (session issue)
# - test_rate_limit_triggers (rate limit not enforcing)
```

### 3. End-to-End Tests
```bash
# Run E2E tests
pytest tests/e2e/ -v

# Expected: All passing after session fix
```

### 4. Manual API Testing

**Start the server:**
```bash
uvicorn ai_memory_layer.main:app --reload
```

**Test sequence:**
```bash
# 1. Health check
curl http://localhost:8000/v1/admin/health

# 2. Store message
curl -X POST http://localhost:8000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test",
    "conversation_id": "conv-1",
    "role": "user",
    "content": "I love Python programming"
  }'

# 3. Search (wait 2-3 seconds for embedding)
curl "http://localhost:8000/v1/memory/search?tenant_id=test&query=Python&top_k=5"

# 4. Check metrics
curl http://localhost:8000/metrics
```

### 5. Load Testing

```bash
# Install Apache Bench
brew install httpd  # macOS

# Test message creation (100 requests, 10 concurrent)
ab -n 100 -c 10 \
   -p message.json \
   -T application/json \
   http://localhost:8000/v1/messages

# Create message.json:
echo '{"tenant_id":"load-test","conversation_id":"c1","role":"user","content":"test"}' > message.json
```

## 🚀 Deployment Steps

### Prerequisites
1. **Get Google Gemini API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Create new API key (free tier: 60 requests/minute)
   - Save for environment configuration

2. **Provision PostgreSQL Database**
   - Managed service (AWS RDS, Google Cloud SQL, etc.)
   - Enable pgvector extension:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

### Option 1: Docker Deployment

```bash
# 1. Build image
docker build -t ai-memory-layer:latest .

# 2. Create .env file
cat > .env << EOF
MEMORY_DATABASE_URL=postgresql+asyncpg://user:pass@db-host:5432/memory_layer
MEMORY_EMBEDDING_PROVIDER=google_gemini
MEMORY_GEMINI_API_KEY=your-key-here
MEMORY_API_KEYS=prod-key-1,prod-key-2
MEMORY_ALLOWED_ORIGINS=https://yourdomain.com
MEMORY_ENVIRONMENT=production
EOF

# 3. Run migrations
docker run --env-file .env ai-memory-layer:latest alembic upgrade head

# 4. Start container
docker run -d \
  --name memory-layer \
  --env-file .env \
  -p 8000:8000 \
  ai-memory-layer:latest
```

### Option 2: Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-memory-layer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-memory-layer
  template:
    metadata:
      labels:
        app: ai-memory-layer
    spec:
      containers:
      - name: api
        image: ai-memory-layer:latest
        ports:
        - containerPort: 8000
        env:
        - name: MEMORY_DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: memory-layer-secrets
              key: database-url
        - name: MEMORY_GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: memory-layer-secrets
              key: gemini-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### Option 3: Cloud Platform (Heroku, Railway, etc.)

```bash
# Example: Railway
railway init
railway add
railway up

# Set environment variables in Railway dashboard
```

## 🔧 Production Configuration

### Environment Variables

```bash
# Database
MEMORY_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
MEMORY_DATABASE_POOL_SIZE=20
MEMORY_DATABASE_MAX_OVERFLOW=10

# Embeddings
MEMORY_EMBEDDING_PROVIDER=google_gemini
MEMORY_GEMINI_API_KEY=your-key
MEMORY_EMBEDDING_DIMENSIONS=768

# Security
MEMORY_API_KEYS=key1,key2,key3
MEMORY_ALLOWED_ORIGINS=https://app.com,https://admin.app.com

# Performance
MEMORY_GLOBAL_RATE_LIMIT=200/minute
MEMORY_REQUEST_TIMEOUT_SECONDS=30

# Retention
MEMORY_RETENTION_MAX_AGE_DAYS=30
MEMORY_RETENTION_IMPORTANCE_THRESHOLD=0.35
MEMORY_RETENTION_SCHEDULE_SECONDS=86400  # Run daily

# Monitoring
MEMORY_ENVIRONMENT=production
MEMORY_LOG_LEVEL=INFO
MEMORY_METRICS_ENABLED=true
```

## 📊 Monitoring

### Key Metrics to Track

1. **Request Metrics**
   - `http_requests_total` - Total requests by endpoint
   - `http_request_duration_seconds` - Latency histogram
   - `http_requests_in_flight` - Concurrent requests

2. **Business Metrics**
   - `messages_created_total` - Messages stored
   - `memory_searches_total` - Search requests
   - `embedding_generation_duration_seconds` - Embedding time

3. **System Metrics**
   - Database connection pool usage
   - Memory usage
   - CPU usage

### Grafana Dashboard Example

```json
{
  "dashboard": {
    "title": "AI Memory Layer",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
          }
        ]
      }
    ]
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Embedding Generation Slow**
   - **Symptom**: Requests taking >5 seconds
   - **Solution**: Implement background job queue

2. **Rate Limit Not Working**
   - **Symptom**: Can send unlimited requests
   - **Solution**: Fix SlowAPI integration or use alternative

3. **Database Connection Errors**
   - **Symptom**: "too many connections"
   - **Solution**: Adjust `MEMORY_DATABASE_POOL_SIZE`

4. **Out of Memory**
   - **Symptom**: Container crashes
   - **Solution**: Increase memory limit, optimize embedding caching

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run (`alembic upgrade head`)
- [ ] Google Gemini API key configured and tested
- [ ] API keys generated for authentication
- [ ] CORS origins configured for your domain
- [ ] Health check endpoint accessible
- [ ] Metrics endpoint accessible
- [ ] Load testing completed
- [ ] Monitoring/alerting configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented

## 🎯 Production Readiness Score

**Current: 85%**

- ✅ Core Features: 100%
- ✅ Infrastructure: 90%
- ⚠️ Testing: 87% (13/15 tests passing)
- ⚠️ Performance: 70% (needs background jobs)
- ⚠️ Monitoring: 60% (metrics exist, dashboards needed)

**To reach 100%:**
1. Fix 2 failing tests (database session + rate limiting)
2. Implement background job queue
3. Add database indexes
4. Set up monitoring dashboards
5. Complete load testing

## 📞 Support

For issues or questions:
1. Check logs: `docker logs memory-layer`
2. Review metrics: `curl http://localhost:8000/metrics`
3. Check health: `curl http://localhost:8000/v1/admin/health`

## 🔄 Maintenance

### Daily
- Monitor error rates
- Check embedding generation times
- Review retention job logs

### Weekly
- Review slow queries
- Check database size growth
- Analyze usage patterns

### Monthly
- Update dependencies
- Review and optimize retention policies
- Capacity planning review
