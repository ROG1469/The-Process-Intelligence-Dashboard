# Quick Dokploy Setup Instructions

## Critical: Set Environment Variables BEFORE Deployment

### In Dokploy Dashboard:

1. **Go to your application/project settings**
2. **Add these environment variables:**

#### Required Variables:
```bash
# Backend API URL (MUST be the public URL your users' browsers can access)
NEXT_PUBLIC_API_URL=https://your-backend-domain.dokploy.app

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Optional: Restrict CORS to your frontend domain
FRONTEND_URL=https://your-frontend-domain.dokploy.app
```

### Important Notes:

1. **`NEXT_PUBLIC_API_URL`**:
   - This MUST be the **public URL** where the backend is accessible
   - If Dokploy gives your backend: `https://api.yourdomain.dokploy.app`
   - Then set: `NEXT_PUBLIC_API_URL=https://api.yourdomain.dokploy.app`
   - ❌ DON'T use: `http://api:5000` (this won't work in browsers)
   - ❌ DON'T use: `http://localhost:5000` (unless testing locally)

2. **`SUPABASE_URL` and `SUPABASE_ANON_KEY`**:
   - Get these from your Supabase dashboard
   - Project Settings → API → Project URL and anon/public key

3. **`FRONTEND_URL`** (optional but recommended):
   - Set this to your frontend domain for CORS security
   - Or use `*` to allow all origins (less secure)

## Deployment Steps:

### Option 1: Docker Compose (Recommended)
1. Create new **Docker Compose** app in Dokploy
2. Repository: `https://github.com/ROG1469/The-Process-Intelligence-Dashboard.git`
3. Branch: `main`
4. Compose file: `dokploy-compose.yml`
5. Add environment variables (see above)
6. Deploy!

### Option 2: Separate Apps
Deploy backend first, then frontend:

#### A. Deploy Backend:
1. Create new app: `pi-api`
2. Repository: Same as above
3. Dockerfile path: `backend/Dockerfile`
4. Port: `5000`
5. Add env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
6. Deploy and note the public URL (e.g., `https://api.yourdomain.dokploy.app`)

#### B. Deploy Frontend:
1. Create new app: `pi-dashboard`
2. Repository: Same as above
3. Dockerfile path: `Dockerfile`
4. Port: `3000`
5. Add env var: `NEXT_PUBLIC_API_URL=<your-backend-public-url-from-step-A>`
6. Deploy!

## Troubleshooting:

### "Cannot connect to server" Error:
**Cause**: `NEXT_PUBLIC_API_URL` is not set correctly

**Fix**: 
1. Check what your backend's public URL is in Dokploy
2. Update `NEXT_PUBLIC_API_URL` to that exact URL
3. Redeploy the frontend

### "Failed to fetch" or CORS Error:
**Cause**: Backend CORS not allowing your frontend domain

**Fix**:
1. Set `FRONTEND_URL=https://your-frontend-domain.dokploy.app` in backend
2. Or set `FRONTEND_URL=*` to allow all (less secure)
3. Redeploy backend

### Supabase Connection Failed:
**Cause**: Wrong Supabase credentials or network issue

**Fix**:
1. Verify credentials in Supabase dashboard
2. Check backend logs in Dokploy
3. Try the health endpoint: `https://your-backend-url/api/supabase/test`

## Testing After Deployment:

1. **Backend Health**: Visit `https://your-backend-url/api/health`
   - Should return: `{"status": "OK", ...}`

2. **Supabase Test**: Visit `https://your-backend-url/api/supabase/test`
   - Should return: `{"status": "connected", ...}`

3. **Frontend**: Visit your frontend URL
   - Try to sign up with a test account
   - Check browser console (F12) for error messages

## Getting Your URLs:

In Dokploy dashboard:
- Each deployed app has a **Domain** section
- Copy the public URL from there
- Use that URL for `NEXT_PUBLIC_API_URL`

## Example Configuration:

If Dokploy assigns:
- Frontend: `https://pi-dashboard.mydomain.dokploy.app`
- Backend: `https://pi-api.mydomain.dokploy.app`

Then set:
```bash
# Frontend environment:
NEXT_PUBLIC_API_URL=https://pi-api.mydomain.dokploy.app

# Backend environment:
FRONTEND_URL=https://pi-dashboard.mydomain.dokploy.app
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```
