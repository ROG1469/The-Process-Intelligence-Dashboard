# 🚀 OPTION 1: Deploy Backend & Frontend Separately - DETAILED GUIDE

## ✅ **Everything is Ready in the Code!**

Both Dockerfiles are configured and will start automatically. Follow these exact steps:

---

## 📋 **PART 1: Deploy Backend API (15 minutes)**

### **Step 1.1: Create Backend Application in Dokploy**

1. **Open Dokploy Dashboard** (your Dokploy admin panel)

2. **Click "Create Application"** or "New App" button

3. **Fill in Application Details:**
   ```
   Application Name: process-intelligence-api
   (or any name you want)
   ```

4. **Select Application Type:**
   - Choose: **Application** (NOT Docker Compose)

5. **Select Source:**
   - Choose: **GitHub**
   - Repository URL: `https://github.com/ROG1469/The-Process-Intelligence-Dashboard.git`
   - Branch: `main`

6. **Build Configuration:**
   - Build Type: **Dockerfile**
   - Dockerfile Path: `backend/Dockerfile`
   - Build Context: `backend` (important!)
   
   **OR if there's a "Build Path" field:**
   - Build Path: `backend`
   - Dockerfile: `Dockerfile`

7. **Port Configuration:**
   - Container Port: `5000`
   - Exposed Port: `5000` (or auto)

---

### **Step 1.2: Set Backend Environment Variables**

In the Environment Variables section of your backend app, add:

```bash
NODE_ENV=production
PORT=5000
```

**NOW ADD YOUR SUPABASE CREDENTIALS:**
```bash
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxx
```

**To get Supabase credentials:**
1. Go to https://supabase.com/dashboard
2. Select your project (or create one if you don't have it)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → paste as `SUPABASE_URL`
   - **Project API keys** → **anon/public** key → paste as `SUPABASE_ANON_KEY`

**Also add (optional but recommended):**
```bash
FRONTEND_URL=https://shalin.christian-kazor.com
```

---

### **Step 1.3: Configure Backend Domain**

1. In Dokploy, find the **Domain** or **Networking** section for your backend app

2. **Add Domain:**
   - Option A: Use subdomain: `api.shalin.christian-kazor.com`
   - Option B: Let Dokploy auto-generate: `your-app-name.dokploy-domain.com`

3. **Enable SSL** (usually automatic with Let's Encrypt)

4. **Note down the final URL** - you'll need it! Example:
   ```
   https://api.shalin.christian-kazor.com
   ```

---

### **Step 1.4: Deploy Backend**

1. **Click "Deploy"** button

2. **Watch the build logs** - you'll see:
   ```
   Building Docker image...
   ✓ Copying package files
   ✓ Installing dependencies
   ✓ Copying application code
   ✓ Starting server...
   ```

3. **Wait for deployment to complete** (2-5 minutes)

4. **Status should show: "Running"** or "Healthy"

---

### **Step 1.5: Test Backend is Working**

**Open these URLs in your browser:**

1. **Health Check:**
   ```
   https://YOUR-BACKEND-URL/api/health
   ```
   Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "2025-11-05T...",
     "uptime": 42,
     "supabase": "connected"
   }
   ```

2. **Supabase Test:**
   ```
   https://YOUR-BACKEND-URL/api/supabase/test
   ```
   Should return:
   ```json
   {
     "status": "connected",
     "message": "Supabase connection successful"
   }
   ```

**✅ If both work, backend is deployed successfully! Proceed to Part 2.**

**❌ If you see errors:**
- Check backend logs in Dokploy
- Verify Supabase credentials are correct
- Make sure Dockerfile path is `backend/Dockerfile`

---

## 📋 **PART 2: Update Frontend to Connect to Backend (5 minutes)**

### **Step 2.1: Open Your Existing Frontend App**

1. Go to your **existing frontend application** in Dokploy
   - The one serving `https://shalin.christian-kazor.com`

2. Click on it to open settings

---

### **Step 2.2: Add/Update Environment Variables**

Find the **Environment Variables** section and add:

```bash
NEXT_PUBLIC_API_URL=https://YOUR-ACTUAL-BACKEND-URL
```

**IMPORTANT:** Replace `YOUR-ACTUAL-BACKEND-URL` with the URL from Step 1.4!

**Examples:**
- If your backend is at `https://api.shalin.christian-kazor.com`:
  ```bash
  NEXT_PUBLIC_API_URL=https://api.shalin.christian-kazor.com
  ```

- If Dokploy gave you `https://pi-api.yourdomain.dokploy.app`:
  ```bash
  NEXT_PUBLIC_API_URL=https://pi-api.yourdomain.dokploy.app
  ```

**Also add (if not already there):**
```bash
NODE_ENV=production
```

---

### **Step 2.3: Redeploy Frontend**

1. **Click "Redeploy"** or "Deploy" button on frontend app

2. **Wait for redeployment** (2-5 minutes)

3. **Frontend will automatically:**
   - Pull latest code from GitHub (with all our fixes)
   - Build Next.js app with correct API URL
   - Start automatically on port 3000
   - Be available at `https://shalin.christian-kazor.com`

---

## 📋 **PART 3: Test Everything Works! (2 minutes)**

### **Step 3.1: Test Signup**

1. **Open:** `https://shalin.christian-kazor.com/login`

2. **Click "Sign Up" tab**

3. **Fill in:**
   - Name: Test User
   - Email: test@example.com
   - Password: test123456

4. **Click "Create Account"**

5. **Expected Result:** ✅ Account created, redirected to dashboard!

---

### **Step 3.2: Check Browser Console (If Issues)**

1. **Press F12** to open Developer Tools

2. **Go to Console tab**

3. **Look for:** `API Request: https://your-backend-url/api/auth/signup`

4. **This shows which URL frontend is trying to connect to**

**If URL is wrong:**
- Go back to Step 2.2
- Fix `NEXT_PUBLIC_API_URL`
- Redeploy frontend again

---

## 🎯 **What Happens Automatically:**

### **Backend (Automatic):**
✅ Dokploy builds Docker image from `backend/Dockerfile`
✅ Installs all Node.js dependencies
✅ Copies backend code
✅ Runs: `CMD ["node", "server.js"]` automatically
✅ Server starts on port 5000
✅ Health checks run every 30 seconds
✅ Auto-restarts if it crashes

### **Frontend (Automatic):**
✅ Dokploy builds Docker image from `Dockerfile`
✅ Installs dependencies
✅ Builds Next.js app with your API URL
✅ Runs: `CMD ["node", "server.js"]` automatically
✅ Server starts on port 3000
✅ Serves your app at your domain
✅ Auto-restarts if it crashes

**You don't need to manually start anything!**

---

## ❓ **Troubleshooting Common Issues:**

### **Issue 1: Backend build fails**
**Error:** "Dockerfile not found" or "Context not found"

**Fix:**
- In Dokploy backend app settings:
- Make sure "Build Context" is set to: `backend`
- Or "Dockerfile Path" is: `backend/Dockerfile`
- Redeploy

---

### **Issue 2: Backend starts but health check fails**
**Error:** Backend shows as "unhealthy"

**Fix:**
1. Check backend logs in Dokploy
2. Look for Supabase connection errors
3. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
4. Test: `https://your-backend-url/api/health` in browser

---

### **Issue 3: Frontend still says "Cannot connect to server"**
**Cause:** `NEXT_PUBLIC_API_URL` is wrong or not set

**Fix:**
1. Open browser console (F12) on login page
2. Look for: `API Request: https://...`
3. Check if URL is correct
4. Go to frontend app in Dokploy
5. Verify `NEXT_PUBLIC_API_URL=https://your-actual-backend-url`
6. **Important:** Redeploy frontend after changing env vars!

---

### **Issue 4: CORS error in browser**
**Error:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Fix:**
1. Go to backend app in Dokploy
2. Add environment variable:
   ```bash
   FRONTEND_URL=https://shalin.christian-kazor.com
   ```
3. Redeploy backend

---

### **Issue 5: Supabase connection fails**
**Error:** Backend logs show "Supabase connection failed"

**Fix:**
1. Verify your Supabase project exists
2. Check credentials at https://supabase.com/dashboard
3. Make sure you copied the FULL keys (they're long!)
4. Update backend env vars in Dokploy
5. Redeploy backend

---

## 📊 **Final Checklist:**

Before you start, make sure you have:

- [ ] Dokploy account and access
- [ ] Your GitHub repository URL
- [ ] Supabase account (free tier is fine)
- [ ] Supabase project created
- [ ] Supabase URL and anon key ready
- [ ] Your domain configured in Dokploy

---

## 🎉 **Success Indicators:**

You'll know it's working when:

✅ Backend health check returns `{"status": "OK"}`
✅ Frontend loads at `https://shalin.christian-kazor.com/login`
✅ Signup form works without errors
✅ Account gets created in Supabase
✅ You're redirected to dashboard after signup
✅ Browser console shows no errors

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check backend logs** in Dokploy
2. **Check frontend logs** in Dokploy
3. **Check browser console** (F12)
4. **Test backend endpoints directly** in browser
5. **Verify all environment variables** are set correctly

---

**Both services will start automatically - just configure and deploy!** 🚀

**Estimated Total Time: 20-25 minutes**
