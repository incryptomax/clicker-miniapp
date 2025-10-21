# 🚀 Deployment Guide - Telegram Clicker Game

## ✅ Current Status

**ALL SERVICES SUCCESSFULLY DEPLOYED AND RUNNING!**

### 🟢 Running Services
- **API Service** (NestJS): http://localhost:3000 ✅
- **Bot Service** (Telegraf): http://localhost:3001 ✅
- **Worker Service** (Bull Queues): http://localhost:3002 ✅
- **WebApp Service** (React): http://localhost:3003 ✅
- **PostgreSQL**: localhost:5432 ✅
- **Redis**: localhost:6379 ✅
- **Redis Commander**: http://localhost:8081 ✅
- **Nginx**: http://localhost ✅

### 🔗 Access Points
- **Main Application**: http://localhost/webapp/
- **API Health**: http://localhost/api/health
- **Bot Health**: http://localhost/bot/health
- **Worker Health**: http://localhost/worker/health
- **WebApp Health**: http://localhost/webapp/health
- **Redis Commander**: http://localhost:8081

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Launch All Services
```bash
# Clone repository
git clone https://github.com/incryptomax/clickerminiapp.git
cd clickerminiapp

# Start all services
TELEGRAM_BOT_TOKEN=dummy_token \
TELEGRAM_WEBHOOK_URL=http://localhost/webhook \
WEBAPP_URL=http://localhost:3003 \
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# Test all services
curl http://localhost/api/health
curl http://localhost/bot/health
curl http://localhost/worker/health
curl http://localhost/webapp/health
```

## 🏗️ Architecture Overview

### Microservices Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram      │    │      Nginx      │    │   PostgreSQL    │
│   Bot Service   │◄──►│   Reverse Proxy  │◄──►│   Database      │
│   (Telegraf)    │    │   (Port 80)     │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Service   │    │   WebApp        │    │      Redis      │
│   (NestJS)      │◄──►│   Service       │    │   Cache/Queue   │
│   (Port 3000)   │    │   (React)       │    │   (Port 6379)   │
└─────────────────┘    │   (Port 3003)   │    └─────────────────┘
         ▲              └─────────────────┘             ▲
         │                        ▲                     │
         ▼                        │                     ▼
┌─────────────────┐              │              ┌─────────────────┐
│  Worker Service │              │              │ Redis Commander │
│  (Bull Queues)  │──────────────┘              │   (Port 8081)   │
│  (Port 3002)    │                             └─────────────────┘
└─────────────────┘
```

### Service Details

#### 🔧 API Service (NestJS)
- **Port**: 3000
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management
- **Features**: 
  - Click processing with rate limiting
  - Leaderboard with ETag caching
  - Health checks and monitoring
  - Idempotency protection

#### 🤖 Bot Service (Telegraf)
- **Port**: 3001
- **Framework**: Telegraf + NestJS
- **Features**:
  - Telegram bot commands (/start, /leaderboard)
  - Mini App integration
  - Webhook handling
  - User registration and management

#### ⚙️ Worker Service (Bull Queues)
- **Port**: 3002
- **Framework**: NestJS + Bull
- **Features**:
  - Background job processing
  - Click event processing
  - Leaderboard updates
  - Periodic data cleanup
  - Queue management

#### 📱 WebApp Service (React)
- **Port**: 3003
- **Framework**: React + TypeScript
- **Features**:
  - Telegram Mini App interface
  - Interactive clicker game
  - Real-time leaderboard
  - Responsive design
  - Telegram theme integration

## 🔧 Configuration

### Environment Variables
```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=http://localhost/webhook
WEBAPP_URL=http://localhost:3003

# Optional (with defaults)
NODE_ENV=production
LOG_LEVEL=info
API_PORT=3000
BOT_PORT=3001
WORKER_PORT=3002
WEBAPP_PORT=3003
POSTGRES_PORT=5432
REDIS_PORT=6379
REDIS_COMMANDER_PORT=8081
```

### Docker Compose Services
- `postgres`: PostgreSQL database
- `redis`: Redis cache and message broker
- `redis-commander`: Web UI for Redis management
- `api`: NestJS API service
- `bot`: Telegram bot service
- `worker`: Background worker service
- `webapp`: React web application
- `nginx`: Reverse proxy and load balancer

## 📊 Monitoring

### Health Checks
All services provide Kubernetes-style health checks:

```bash
# Liveness probes
curl http://localhost/api/health/live
curl http://localhost/bot/health/live
curl http://localhost/worker/health/live

# Readiness probes
curl http://localhost/api/health/ready
curl http://localhost/bot/health/ready
curl http://localhost/worker/health/ready

# Startup probes
curl http://localhost/api/health/startup
curl http://localhost/bot/health/startup
curl http://localhost/worker/health/startup
```

### Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs bot
docker-compose -f docker-compose.prod.yml logs worker
docker-compose -f docker-compose.prod.yml logs webapp
```

## 🛠️ Troubleshooting

### Common Issues

1. **Service Not Starting**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs [service_name]
   
   # Restart service
   docker-compose -f docker-compose.prod.yml restart [service_name]
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Check Redis
   docker-compose -f docker-compose.prod.yml logs redis
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   docker-compose -f docker-compose.prod.yml ps
   
   # Stop conflicting services
   docker-compose -f docker-compose.prod.yml down
   ```

### Performance Tuning

1. **Resource Limits**
   ```yaml
   # Add to docker-compose.prod.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

2. **Scaling Services**
   ```bash
   # Scale API service
   docker-compose -f docker-compose.prod.yml up -d --scale api=3
   
   # Scale Worker service
   docker-compose -f docker-compose.prod.yml up -d --scale worker=2
   ```

## 🚀 Production Deployment

### Security Considerations
- All services run behind Nginx reverse proxy
- Content Security Policy (CSP) configured for WebApp
- Rate limiting implemented at multiple levels
- Health checks for monitoring and auto-recovery

### Scaling Strategy
- Horizontal scaling: Multiple instances of API and Worker services
- Vertical scaling: Resource limits and monitoring
- Database optimization: Connection pooling and query optimization
- Cache strategy: Redis for session and leaderboard caching

### Backup Strategy
- PostgreSQL: Automated database backups
- Redis: Persistence enabled for data durability
- Configuration: Version controlled in Git

---

**Status**: ✅ All services deployed and operational
**Last Updated**: October 2025
