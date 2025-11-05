# Dokploy Deployment Guide

## Prerequisites
- Dokploy instance running
- GitHub repository access
- Supabase account (for database)

## Environment Variables

### Frontend (Next.js)
Set these in Dokploy's frontend application settings:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### Backend (Express.js)
Set these in Dokploy's backend application settings:
```
NODE_ENV=production
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
OPENROUTER_API_KEY=your-openrouter-api-key (optional)
JWT_SECRET=your-jwt-secret
```

## Deployment Steps

### Option 1: Deploy with Docker Compose (Recommended)
1. In Dokploy, create a new **Docker Compose** application
2. Connect to GitHub repository: `https://github.com/ROG1469/The-Process-Intelligence-Dashboard.git`
3. Set branch to `main`
4. Dokploy will automatically detect `docker-compose.yml`
5. Add environment variables in Dokploy UI
6. Deploy!

### Option 2: Deploy Frontend and Backend Separately

#### Frontend Deployment
1. Create new **Application** in Dokploy
2. Source: GitHub
3. Repository: `https://github.com/ROG1469/The-Process-Intelligence-Dashboard.git`
4. Branch: `main`
5. Build Type: Dockerfile
6. Dockerfile path: `Dockerfile` (root)
7. Port: `3000`
8. Add environment variables
9. Deploy

#### Backend Deployment
1. Create new **Application** in Dokploy
2. Source: GitHub
3. Repository: `https://github.com/ROG1469/The-Process-Intelligence-Dashboard.git`
4. Branch: `main`
5. Build Type: Dockerfile
6. Dockerfile path: `backend/Dockerfile`
7. Port: `5000`
8. Add environment variables
9. Deploy

## Fixes Applied

### ✅ Fixed Issues:
1. **Created `public` directory** - Next.js requires this folder even if empty
2. **Fixed ENV format** - Changed from `ENV KEY value` to `ENV KEY=value` format
3. **Optimized COPY commands** - Added `--chown` to reduce layers
4. **Updated .dockerignore** - Excluded unnecessary files for faster builds

## Post-Deployment

### Verify Deployment
1. **Frontend**: Visit `https://your-frontend-domain.com`
2. **Backend Health**: Visit `https://your-backend-domain.com/api/health`
3. **Supabase Connection**: Visit `https://your-backend-domain.com/api/supabase/test`

### Configure CORS
Make sure your backend allows requests from your frontend domain. Update the CORS configuration in `backend/server.js` if needed.

### SSL Certificates
Dokploy automatically handles SSL certificates via Let's Encrypt. Make sure your domain DNS is properly configured.

## Troubleshooting

### Build Fails with "public not found"
- Make sure the latest code is pushed to GitHub
- The `public` directory is now created and committed

### Environment Variables Not Working
- Check Dokploy's environment variable settings
- Restart the application after adding/updating variables

### Backend Can't Connect to Supabase
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check backend logs in Dokploy

### Frontend Can't Connect to Backend
- Verify `NEXT_PUBLIC_API_URL` points to your backend domain
- Check CORS settings in backend

## Monitoring

### Logs
- View application logs in Dokploy dashboard
- Backend logs are also stored in the `/app/logs` directory

### Health Checks
- Backend: `GET /api/health`
- Returns: `{"status": "OK", "timestamp": "...", "uptime": ..., "supabase": "connected"}`

## Scaling
- Dokploy supports horizontal scaling
- Increase replicas in application settings
- Consider adding a load balancer for production

## Backup
- Regular database backups via Supabase
- Application code is version-controlled in GitHub

## Support
For issues, check:
1. Dokploy logs
2. GitHub Actions (CI/CD)
3. Supabase dashboard
