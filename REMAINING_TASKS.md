# Production Readiness - Remaining Tasks

## ✅ Already Fixed
- ✅ Database connection pooling (configured)
- ✅ Input validation limits (max_length added)
- ✅ .env.example (created)

---

## 🔴 CRITICAL - Must Fix Before Production

### 1. **Rate Limiting** ⚠️ **BLOCKER**

**Status**: ❌ Not implemented

**Why Critical**: Without rate limiting, your API can be abused/DoS'd

**Quick Fix** (15 minutes):
```bash
# Add to pyproject.toml dependencies
slowapi = "^0.1.9"

# Then add to main.py:
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to routes (e.g., in routes/messages.py):
@router.post("")
@limiter.limit("100/minute")  # Adjust as needed
async def create_message(...):
    ...
```

**Priority**: 🔴 **CRITICAL** - Deploy blocker

---

### 2. **CORS Configuration** ⚠️ **If Serving Web Clients**

**Status**: ❌ Not implemented

**Why Needed**: Browser-based clients will be blocked without CORS

**Quick Fix** (5 minutes):
```python
# Add to main.py:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Configure appropriately
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Priority**: 🟡 **HIGH** (only if serving web clients)

---

## 🟡 IMPORTANT - Should Fix Soon

### 3. **Database Indexes** ⚠️ **Performance**

**Status**: ⚠️ Missing indexes on `created_at` and `archived`

**Why Important**: Retention queries will be slow without indexes

**Fix**: Create migration:
```python
# alembic/versions/XXXX_add_indexes.py
def upgrade():
    op.create_index('ix_messages_created_at', 'messages', ['created_at'])
    op.create_index('ix_messages_archived', 'messages', ['archived'])
    op.create_index('ix_messages_tenant_archived', 'messages', ['tenant_id', 'archived'])
```

**Priority**: 🟡 **MEDIUM** - Performance impact

---

### 4. **Request Timeout** ⚠️ **Reliability**

**Status**: ❌ Not configured

**Why Important**: Long-running requests can tie up workers

**Fix**: Add to uvicorn config or middleware

**Priority**: 🟡 **MEDIUM**

---

### 5. **Error Handling Improvements** ⚠️ **User Experience**

**Status**: ⚠️ Basic error handling exists, but could be better

**Issues**:
- Embedding failures not clearly communicated
- No retry logic for transient failures
- No circuit breaker for external services

**Priority**: 🟡 **MEDIUM**

---

## 💡 NICE TO HAVE

### 6. **Request ID Tracking** 🔵 **Debugging**

Add request ID middleware for better log tracing

### 7. **Health Check Enhancements** 🔵 **Monitoring**

Add embedding service health check to `/v1/admin/health`

### 8. **Load Testing** 🔵 **Validation**

Test with 100+ concurrent requests to verify performance

---

## 📋 Pre-Deployment Checklist

### Must Do:
- [ ] **Add rate limiting** (15 min)
- [ ] **Add CORS** if serving web clients (5 min)
- [ ] **Test with production-like load** (30 min)
- [ ] **Set all environment variables** in production
- [ ] **Run migrations** (`alembic upgrade head`)

### Should Do:
- [ ] Add database indexes (15 min)
- [ ] Add request timeout (10 min)
- [ ] Improve error messages (30 min)

### Nice to Have:
- [ ] Request ID tracking
- [ ] Enhanced health checks
- [ ] Load testing suite

---

## ⏱️ Time Estimate

**Minimum for Production**: ~1 hour
- Rate limiting: 15 min
- CORS (if needed): 5 min
- Testing: 30 min
- Deployment setup: 10 min

**Recommended**: ~2-3 hours
- Above + indexes + timeouts + error handling

---

## 🚀 Quick Start to Production

1. **Add rate limiting** (critical)
2. **Add CORS** (if needed)
3. **Test locally** with docker-compose
4. **Set environment variables** in production
5. **Run migrations**
6. **Deploy**

**You're 85% there! Just need rate limiting and you're good to go.** 🎯

