# Docker Deployment Guide

This guide explains how to deploy the Process Intelligence Hub using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Environment variables configured

## Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Backend Environment Variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
NODE_ENV=production
```

### 2. Build and Run with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Individual Container Commands

### Frontend Only

```bash
# Build frontend image
docker build -t process-intelligence-frontend .

# Run frontend container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:5000 \
  process-intelligence-frontend
```

### Backend Only

```bash
# Build backend image
docker build -t process-intelligence-backend ./backend

# Run backend container
docker run -p 5000:5000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  -e OPENROUTER_API_KEY=your_key \
  process-intelligence-backend
```

## Production Deployment

### Using Docker Compose (Recommended)

1. **Update docker-compose.yml** with your production settings
2. **Set environment variables** in backend/.env
3. **Deploy**:

```bash
docker-compose -f docker-compose.yml up -d --build
```

### Using Container Registry

1. **Tag images**:

```bash
docker tag process-intelligence-frontend:latest your-registry.com/frontend:v1.0.0
docker tag process-intelligence-backend:latest your-registry.com/backend:v1.0.0
```

2. **Push to registry**:

```bash
docker push your-registry.com/frontend:v1.0.0
docker push your-registry.com/backend:v1.0.0
```

3. **Pull and run on server**:

```bash
docker pull your-registry.com/frontend:v1.0.0
docker pull your-registry.com/backend:v1.0.0
docker-compose up -d
```

## Monitoring & Logs

### View Container Logs

```bash
# All services
docker-compose logs -f

# Frontend only
docker-compose logs -f frontend

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Access Backend Log Files

Logs are stored in a Docker volume:

```bash
# List volumes
docker volume ls

# Inspect backend logs volume
docker volume inspect aiprocessbottleneckdetector1_backend-logs

# View log files
docker exec -it process-intelligence-backend cat /app/logs/combined.log
docker exec -it process-intelligence-backend cat /app/logs/error.log
```

### Health Checks

```bash
# Check backend health
curl http://localhost:5000/api/health

# Check container health status
docker-compose ps
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker exec -it process-intelligence-backend env

# Restart services
docker-compose restart
```

### Connection issues

1. **Verify network**:
```bash
docker network ls
docker network inspect aiprocessbottleneckdetector1_app-network
```

2. **Test connectivity**:
```bash
# From frontend to backend
docker exec -it process-intelligence-frontend ping backend

# From backend to frontend
docker exec -it process-intelligence-backend ping frontend
```

### Performance issues

```bash
# Check resource usage
docker stats

# View container details
docker inspect process-intelligence-backend
docker inspect process-intelligence-frontend
```

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart with new images
docker-compose up -d

# Remove old images
docker image prune -a
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes logs)
docker-compose down -v

# Remove images
docker rmi process-intelligence-frontend process-intelligence-backend

# Full cleanup
docker-compose down -v --rmi all
```

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use secrets management** in production (Docker Secrets, Vault, etc.)
3. **Run as non-root user** (already configured in Dockerfiles)
4. **Keep images updated** regularly
5. **Scan images** for vulnerabilities:

```bash
docker scan process-intelligence-frontend
docker scan process-intelligence-backend
```

## CI/CD Integration

The project includes GitHub Actions workflows in `.github/workflows/ci.yml`:

- Automated testing
- Docker image building
- Container registry pushing
- Deployment to staging/production

See the CI/CD documentation for more details.
