# 🤖 AI Integration Guide - OpenRouter Setup

## ✅ What Was Done

### ML Removal (Completed)
1. ✅ Deleted `backend/routes/analyze.js` (old ML endpoint)
2. ✅ Removed ML code from `backend/routes/insights.js`
3. ✅ Removed ML route from `backend/server.js`
4. ✅ Removed `ml-matrix` and `ml-regression` from `package.json`
5. ✅ Kept `axios` (needed for OpenRouter API calls)

### AI Integration (Completed)
1. ✅ Created `backend/services/openrouter.js` - AI service module
2. ✅ Integrated OpenRouter into `backend/routes/insights.js`
3. ✅ Updated frontend comments (ML → AI-Powered)
4. ✅ Added fallback to rule-based insights if AI fails

---

## 🔑 SETUP INSTRUCTIONS (YOU MUST DO THIS)

### Step 1: Get Your OpenRouter API Key
1. Go to: https://openrouter.ai/keys
2. Sign up / Log in
3. Create a new API key
4. Copy your key

### Step 2: Configure Backend
1. Open file: **`backend/.env`**
2. Find these lines:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
   ```

3. Replace `your_openrouter_api_key_here` with your actual API key:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
   ```

4. Choose your preferred model (or keep the default):

   **Available Models:**
   - `anthropic/claude-3.5-sonnet` - Best quality (~$0.003/request) ⭐ **RECOMMENDED**
   - `openai/gpt-4o-mini` - Good balance (~$0.0015/request)
   - `google/gemini-pro-1.5` - Google's best (~$0.001/request)
   - `meta-llama/llama-3.1-8b-instruct` - Cheapest (~$0.0001/request)

### Step 3: Install Dependencies
```bash
cd backend
npm install
```

### Step 4: Start Backend Server
```bash
cd backend
npm start
```

You should see:
```
✅ Server running on port 5000
🤖 AI Service: Enabled
```

If you see `🤖 AI Service: Disabled`, check that you set your API key correctly in `.env`

---

## 🎯 How It Works

### AI-Powered Insights (NEW)
- **Critical/High Risk Processes (risk >= 60):** Uses OpenRouter AI to generate context-aware insights
- **Medium/Low Risk Processes (risk < 60):** Uses rule-based fallback (fast & free)
- **If AI fails:** Automatically falls back to rule-based insights (no errors shown to user)

### Example AI Insight:
> 🔴 Dispatch is critically delayed (9 minutes over target, 75% delay). Add 2-3 workers to loading dock during 2-5pm peak hours to reduce congestion and restore throughput.

### Example Rule-Based Insight:
> 📊 Packaging showing 30% delay (risk: 55). Monitor closely and prepare contingency plans to prevent escalation.

---

## 💰 Cost Estimation

**With Claude 3.5 Sonnet** (~$0.003 per insight):
- 10 AI insights = $0.03
- 100 AI insights = $0.30
- 1000 AI insights = $3.00

**Cost Optimization:**
- Only Critical/High risk processes use AI (typically 1-3 per session)
- Lower risk processes use free rule-based insights
- Estimated cost per page load: **$0.001 - $0.01** (essentially free for demo)

---

## 🧪 Testing

### Test 1: Start Backend
```bash
cd backend
npm start
```

Expected output:
```
✅ Server running on port 5000
🤖 AI Service: Enabled (using anthropic/claude-3.5-sonnet)
```

### Test 2: Query Insights Endpoint
```bash
# PowerShell
Invoke-RestMethod 'http://localhost:5000/api/insights?range=last1Hour'
```

Expected response:
```json
{
  "success": true,
  "count": 3,
  "messages": [
    "🔴 AI-generated insight for critical process...",
    "⚠️ AI-generated insight for high risk...",
    "📊 Rule-based insight for medium risk..."
  ]
}
```

Check console for:
```
✅ Generated 3 insights (2 AI-powered, 1 rule-based)
```

### Test 3: Frontend Integration
1. Start frontend: `npm run dev`
2. Open http://localhost:3000
3. Check AI Insights Panel
4. Should see insights generated for bottleneck processes

---

## 🔧 Troubleshooting

### Problem: "AI Service: Disabled"
**Solution:** Check `.env` file - make sure `OPENROUTER_API_KEY` is set correctly

### Problem: "OpenRouter API error: 401"
**Solution:** Invalid API key - get a new one from https://openrouter.ai/keys

### Problem: "OpenRouter API error: 429"
**Solution:** Rate limit exceeded - wait a minute or upgrade your OpenRouter plan

### Problem: No AI insights appearing
**Solution:** 
1. Check backend console for errors
2. Verify processes have risk score >= 60 (only high-risk gets AI)
3. Check that data exists in database (see DATABASE_SEEDING.md)

### Problem: Insights are generic
**Solution:** System is using rule-based fallback - check:
1. API key is valid
2. OpenRouter service is not down
3. Check backend console for specific error messages

---

## 📁 Files Modified

### Backend:
- ❌ **Deleted:** `backend/routes/analyze.js`
- ✏️ **Modified:** `backend/routes/insights.js` (removed ML, added AI)
- ✏️ **Modified:** `backend/server.js` (removed analyze route)
- ✏️ **Modified:** `backend/package.json` (removed ml-* packages)
- ✏️ **Modified:** `backend/.env` (added OpenRouter config)
- ✅ **Created:** `backend/services/openrouter.js` (NEW AI service)

### Frontend:
- ✏️ **Modified:** `src/services/api.ts` (updated comments only, no logic changes)

---

## 🎓 Understanding the Code

### OpenRouter Service (`backend/services/openrouter.js`)
```javascript
// Generates AI insight for high-risk processes
async function generateAIInsight(processData, messageType) {
  // Sends process data to OpenRouter AI
  // Returns natural language insight
}

// Fallback for when AI unavailable
function generateFallbackInsight(processData, messageType) {
  // Returns rule-based insight
}
```

### Insights Route (`backend/routes/insights.js`)
```javascript
// For each high-risk process:
if (aiConfigured && riskScore >= 60) {
  // Use AI
  aiMessage = await generateAIInsight(processData, type);
} else {
  // Use rules
  fallbackMessage = generateFallbackInsight(processData, type);
}
```

---

## 🚀 Next Steps

1. ✅ Add your OpenRouter API key to `backend/.env`
2. ✅ Choose your preferred model
3. ✅ Run `npm install` in backend
4. ✅ Start backend server
5. ✅ Test with frontend
6. ✅ Monitor costs at https://openrouter.ai/activity

---

## ⚡ Quick Reference

**Config File:** `backend/.env`
**AI Service:** `backend/services/openrouter.js`
**Insights API:** `backend/routes/insights.js`
**Endpoint:** `http://localhost:5000/api/insights?range=last1Hour`

**AI Activation Threshold:** Risk Score >= 60
**Fallback:** Automatic if AI fails
**Models:** Configurable via `OPENROUTER_MODEL`

---

✅ **Everything is ready - just add your API key and start the server!**
