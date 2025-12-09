# Deployment Guide

Quick guide to deploy Memory Mesh in production.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 14+ with pgvector extension (or use Docker image)
- Redis (or use Docker image)
- Domain name with SSL certificate (for production)
- Server with minimum 2GB RAM, 2 CPU cores

## Quick Start with Docker Compose

### 1. Clone Repository

```bash
git clone https://github.com/shubhhh19/memory-layer.git
cd memory-layer
```

### 2. Configure Environment Variables

Create `.env` file in the root directory:

```bash
# Database
MEMORY_DATABASE_URL=postgresql+asyncpg://memory:memory@db:5432/memory_layer

# JWT Authentication (REQUIRED - generate secure key)
MEMORY_JWT_SECRET_KEY=your-secure-random-key-here
MEMORY_ACCESS_TOKEN_EXPIRE_MINUTES=30
MEMORY_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (REQUIRED for production)
MEMORY_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Environment
MEMORY_ENVIRONMENT=production

# Redis
MEMORY_REDIS_URL=redis://redis:6379/0

# Embeddings (optional)
MEMORY_EMBEDDING_PROVIDER=google_gemini
MEMORY_GEMINI_API_KEY=your-gemini-api-key

# Rate Limiting
MEMORY_GLOBAL_RATE_LIMIT=200/minute
MEMORY_TENANT_RATE_LIMIT=120/minute
```

Generate secure JWT secret key:
```bash
python -c 'import secrets; print(secrets.token_urlsafe(32))'
```

### 3. Update Docker Compose

Edit `docker-compose.yml` and add environment variables:

```yaml
api:
  environment:
    MEMORY_DATABASE_URL: postgresql+asyncpg://memory:memory@db:5432/memory_layer
    MEMORY_JWT_SECRET_KEY: ${MEMORY_JWT_SECRET_KEY}
    MEMORY_ALLOWED_ORIGINS: ${MEMORY_ALLOWED_ORIGINS}
    MEMORY_ENVIRONMENT: production
    MEMORY_REDIS_URL: redis://redis:6379/0
```

### 4. Run Database Migrations

```bash
docker compose run --rm api alembic upgrade head
```

### 5. Start Services

```bash
docker compose up -d
```

Services will be available at:
- Backend API: http://localhost:8001
- Frontend: Configure separately (see Frontend Deployment)

## Production Deployment

### Backend Deployment

#### Option 1: Docker Compose (Recommended)

1. Use the provided `docker-compose.yml`
2. Set up reverse proxy (Nginx/Traefik) with SSL
3. Configure environment variables for production
4. Set up monitoring (Prometheus/Grafana)
5. Configure backups for PostgreSQL

#### Option 2: Kubernetes

1. Create Kubernetes manifests
2. Set up PostgreSQL and Redis as StatefulSets
3. Deploy backend as Deployment with Service
4. Configure Ingress with SSL
5. Set up ConfigMaps and Secrets

#### Option 3: Cloud Platforms

**AWS:**
- Use ECS/Fargate for containers
- RDS PostgreSQL with pgvector extension
- ElastiCache for Redis
- Application Load Balancer with SSL

**Google Cloud:**
- Cloud Run for serverless
- Cloud SQL PostgreSQL
- Memorystore for Redis
- Cloud Load Balancing

**Azure:**
- Container Instances or AKS
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Application Gateway

### Frontend Deployment

#### Option 1: Vercel (Recommended for Next.js)

1. Connect GitHub repository to Vercel
2. Set environment variable: `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com`
3. Deploy automatically on push to main branch

#### Option 2: Docker

1. Build frontend image:
```bash
cd frontend
docker build -t memorymesh-frontend .
```

2. Run container:
```bash
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com \
  memorymesh-frontend
```

#### Option 3: Static Export

1. Build static files:
```bash
cd frontend
npm run build
npm run export
```

2. Serve with Nginx or any static file server

### Database Setup

#### PostgreSQL with pgvector

```bash
# Using Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=memory_layer \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Enable pgvector extension
docker exec -it postgres psql -U postgres -d memory_layer -c "CREATE EXTENSION vector;"
```

#### Run Migrations

```bash
# Local
alembic upgrade head

# Docker
docker compose exec api alembic upgrade head
```

### Redis Setup

```bash
# Using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Variables Checklist

Required for production:
- [ ] `MEMORY_JWT_SECRET_KEY` - Secure random 32+ character string
- [ ] `MEMORY_ALLOWED_ORIGINS` - Specific origins (no wildcards)
- [ ] `MEMORY_DATABASE_URL` - PostgreSQL connection string
- [ ] `MEMORY_ENVIRONMENT=production` - Set to production
- [ ] `MEMORY_REDIS_URL` - Redis connection string

Optional but recommended:
- [ ] `MEMORY_GEMINI_API_KEY` - For Gemini embeddings
- [ ] `MEMORY_GLOBAL_RATE_LIMIT` - Adjust based on needs
- [ ] `MEMORY_TENANT_RATE_LIMIT` - Per-tenant limits

### Security Checklist

- [ ] JWT secret key is secure and random (32+ characters)
- [ ] CORS origins are specific (no wildcards in production)
- [ ] Database credentials are secure
- [ ] SSL/TLS certificates are configured
- [ ] Rate limiting is enabled
- [ ] Firewall rules restrict access
- [ ] Regular backups are configured
- [ ] Monitoring and alerting are set up

### Monitoring

Prometheus metrics are available at `/metrics` endpoint.

Set up Grafana dashboards using configuration in `docs/monitoring/`.

### Backup and Recovery

Use provided backup scripts:

```bash
# Backup database
./scripts/backup.sh

# Restore database
./scripts/restore.sh backup_file.sql
```

### Health Checks

- Health endpoint: `GET /v1/admin/health`
- Readiness endpoint: `GET /v1/admin/readiness`

Configure these in your orchestration platform for automatic restarts.

## Troubleshooting

### Database Connection Issues

Check database URL format:
```
postgresql+asyncpg://user:password@host:port/database
```

### CORS Errors

Ensure `MEMORY_ALLOWED_ORIGINS` includes your frontend domain exactly as it appears in the browser.

### Authentication Failures

Verify `MEMORY_JWT_SECRET_KEY` is set and matches between restarts.

### Rate Limiting Not Working

Ensure Redis is running and `MEMORY_REDIS_URL` is correct.

## Support

- Documentation: [README.md](README.md)
- Integration Guide: [INTEGRATION.md](INTEGRATION.md)
- Issues: [GitHub Issues](https://github.com/shubhhh19/memory-layer/issues)

