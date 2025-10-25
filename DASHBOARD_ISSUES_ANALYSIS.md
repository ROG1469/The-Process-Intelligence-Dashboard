# 🚨 DASHBOARD ISSUES - ROOT CAUSE ANALYSIS

**Date:** October 25, 2025  
**Critical Issues Found:** 5

---

## 📋 USER'S REPORTED ISSUES

### Issue #1: AI Insights Don't Match Dashboard Data
**User's Observation:**
- Chart shows: Material Preparation is RED/Critical
- AI Insights shows: "Material Preparation experiencing recurring delay 7%"
- Chart shows: Assembly 67% efficiency (orange/delayed)
- AI Insights shows: "Assembly predicted to worsen by 50%"

**User's Concern:** "This is very misguiding - no correlation between chart and AI insights"

### Issue #2: Missing Active Bottlenecks Section
**User's Observation:**
- Previous dashboard had clear "Active Bottlenecks" section
- Showed: Process name, delay amount, risk score, cost impact, recommendations
- Current dashboard: Only shows vague AI messages
- Says "No bottlenecks detected" when clearly 3 critical items exist

### Issue #3: Scenario Planner is Empty
**User's Observation:**
- Scenario planner section is completely empty
- No data or recommendations showing

---

## 🔍 ROOT CAUSE INVESTIGATION

### Database Reality Check (last6Hours):

```
Process              | Status   | Actual | Average | Delay%
---------------------|----------|--------|---------|--------
Assembly             | CRITICAL |  1800s |  1200s  | +50%  ⚠️⚠️⚠️
Packaging            | DELAYED  |   480s |   360s  | +33%  ⚠️
Material Preparation | DELAYED  |   960s |   900s  | +6.7% 
Receiving            | DELAYED  |   630s |   600s  | +5%
Quality Check        | COMPLETED|   570s |   600s  | -5%   ✅
Dispatch             | COMPLETED|   690s |   720s  | -4.2% ✅
```

**Critical Process:** Assembly (50% delay, 1800s vs 1200s baseline)

### What AI Insights Actually Shows:

```
Only 2 messages generated:
1. "📈 Packaging experiencing recurring delays (+33%)"
2. "🔮 Assembly predicted to worsen by 50%"
```

**Missing:** Material Preparation, Receiving, Quality Check, Dispatch

---

## 🐛 BUGS FOUND

### BUG #1: Wrong Risk Score Algorithm
**Location:** `backend/routes/insights.js` (lines 102-107)

**Current Formula:**
```javascript
const delayFactor = Math.min(delayPercentage / 100, 1) * 50; // Max 50 points
const durationFactor = Math.min(delayTime / 3600, 1) * 30; // Max 30 points  
const statusFactor = process.status === 'delayed' ? 20 : process.status === 'failed' ? 20 : 0;
const riskScore = Math.min(delayFactor + durationFactor + statusFactor, 100);
```

**Problem:** Assembly has 50% delay (CRITICAL status) but gets LOW risk score!

**Actual Risk Scores Generated:**
- Assembly (50% delay, CRITICAL): Risk Score = **30** ❌ (Should be 80-90)
- Packaging (33% delay, DELAYED): Risk Score = **38** ❌ (Should be 60-70)  
- Material Prep (6.7% delay): Risk Score = **17** ❌ (Should be 30-40)

**Why It's Broken:**
1. `delayFactor` for 50% delay = `0.50 * 50 = 25 points` (too low!)
2. `durationFactor` for 600s delay = `(600/3600) * 30 = 5 points` (too low!)
3. `statusFactor` for "critical" = **0 points** (MISSING! Only checks 'delayed'/'failed')
4. Total: 25 + 5 + 0 = **30 points** (when it should be 80+)

### BUG #2: Threshold Too High (60)
**Location:** `backend/routes/insights.js` (line 111)

**Current Code:**
```javascript
if (riskScore >= thresholdValue || delayPercentage >= 20) {
  // Include in results
}
```

**Problem with Default Threshold (60):**
- Material Prep has risk score 17 → **FILTERED OUT** ❌
- Receiving has risk score 16 → **FILTERED OUT** ❌
- Only 2 processes pass (Packaging 38, Assembly 30 get through via delayPercentage fallback)

**Frontend passes threshold of 60-75** from slider, which is way too high!

### BUG #3: Status Factor Doesn't Check "critical"
**Location:** `backend/routes/insights.js` (line 106)

**Current Code:**
```javascript
const statusFactor = process.status === 'delayed' ? 20 : process.status === 'failed' ? 20 : 0;
```

**Problem:** Assembly has `status = 'critical'` but gets **0 status points**!

**Should be:**
```javascript
const statusFactor = 
  process.status === 'critical' ? 40 :
  process.status === 'failed' ? 30 :
  process.status === 'delayed' ? 20 : 0;
```

### BUG #4: InsightPanel Doesn't Show Bottleneck Cards
**Location:** `src/components/InsightPanel.tsx` (line 420)

**Current Code:**
```typescript
const response = await fetchHighRiskInsights(backendRange);
```

**Error:**
```
Failed to fetch high-risk insights
Could not find a relationship between 'insights' and 'process_steps' in the schema cache
```

**Impact:**
- `analyses` array stays **EMPTY**
- "ACTIVE BOTTLENECKS" section shows nothing
- Says "No bottlenecks detected"
- Risk cards never render

**The InsightPanel has TWO sections:**
1. ✅ AI Messages (top) - Shows 2 messages from `/api/insights`
2. ❌ Active Bottlenecks (bottom) - BROKEN, tries to call `/api/insights/high-risk` which fails

### BUG #5: Message Generation Logic Incorrect
**Location:** `backend/routes/insights.js` (lines 122-126)

**Current Logic:**
```javascript
let messageType = 'bottleneck';
if (riskScore >= 80) messageType = 'anomaly';
else if (delayPercentage >= 50) messageType = 'prediction';
else if (process.status === 'delayed') messageType = 'pattern';
```

**Problem:**
- Assembly: 50% delay → gets "prediction" type ❌ (should be "critical bottleneck")
- Packaging: 33% delay + delayed status → gets "pattern" type ❌ (should be "warning")
- Material Prep: Filtered out entirely ❌

**Better Logic Should Be:**
```javascript
let messageType = 'bottleneck';
let emoji = '⚠️';

if (process.status === 'critical' || riskScore >= 80) {
  messageType = 'critical';
  emoji = '🔴';
} else if (process.status === 'delayed' || riskScore >= 60) {
  messageType = 'warning';
  emoji = '⚠️';
} else if (riskScore >= 40) {
  messageType = 'attention';
  emoji = '📊';
}
```

---

## 🎯 EXPECTED vs ACTUAL BEHAVIOR

### What SHOULD Show (for last6Hours):

**Active Bottlenecks Section:**
```
┌─ ACTIVE BOTTLENECKS (6 processes) ─────────────┐
│                                                 │
│ 🔴 Assembly                          Risk: 85   │
│    +50% delay (600s over baseline)             │
│    Status: CRITICAL                             │
│    Cost Impact: $500/hour lost productivity     │
│    Recommendations:                             │
│      • Add 2 workers immediately                │
│      • Review assembly line bottlenecks         │
│                                                 │
│ ⚠️ Packaging                         Risk: 65   │
│    +33% delay (120s over baseline)              │
│    Status: DELAYED                              │
│    Cost Impact: $150/hour                       │
│    Recommendations:                             │
│      • Optimize packaging workflow              │
│                                                 │
│ 📊 Material Preparation              Risk: 35   │
│    +6.7% delay (60s over baseline)              │
│    Status: DELAYED                              │
│    Recommendation: Monitor closely              │
│                                                 │
│ ... (3 more processes)                          │
└─────────────────────────────────────────────────┘
```

**AI Insights Messages:**
```
💬 AI Recommendations:
  • 🔴 Assembly running 50% behind — CRITICAL bottleneck
  • ⚠️ Packaging delayed by 33% — resource constraint detected
  • 📊 Material Preparation showing 6.7% delay — monitor trend
  • ✅ Quality Check performing efficiently
  • ✅ Dispatch on schedule
```

### What ACTUALLY Shows (current broken state):

**AI Insights:**
```
💬 AI Recommendations:
  • 📈 Packaging experiencing recurring delays (+33%)
  • 🔮 Assembly predicted to worsen by 50%
```

**Active Bottlenecks:**
```
(EMPTY - Error from fetchHighRiskInsights)
"No bottlenecks detected"
```

---

## 🔧 REQUIRED FIXES

### FIX #1: Correct Risk Score Algorithm (CRITICAL)

**File:** `backend/routes/insights.js` (lines 102-107)

**Current (BROKEN):**
```javascript
const delayFactor = Math.min(delayPercentage / 100, 1) * 50;
const durationFactor = Math.min(delayTime / 3600, 1) * 30;
const statusFactor = process.status === 'delayed' ? 20 : process.status === 'failed' ? 20 : 0;
const riskScore = Math.min(delayFactor + durationFactor + statusFactor, 100);
```

**Fixed Version:**
```javascript
// Calculate risk score with proper weighting
let riskScore = 0;

// Delay percentage is primary factor (0-50 points)
const absDelayPercent = Math.abs(delayPercentage);
if (absDelayPercent >= 50) riskScore += 50;
else if (absDelayPercent >= 30) riskScore += 40;
else if (absDelayPercent >= 20) riskScore += 30;
else if (absDelayPercent >= 10) riskScore += 20;
else riskScore += absDelayPercent; // 0-10 points

// Status is critical factor (0-40 points)
if (process.status === 'critical') riskScore += 40;
else if (process.status === 'failed') riskScore += 35;
else if (process.status === 'delayed') riskScore += 20;
else if (process.status === 'in-progress') riskScore += 10;
// completed gets 0

// Duration delay impact (0-10 points)
const delayMinutes = delayTime / 60;
if (delayMinutes >= 60) riskScore += 10; // 1+ hour delay
else if (delayMinutes >= 30) riskScore += 7;
else if (delayMinutes >= 15) riskScore += 5;
else if (delayMinutes > 0) riskScore += 3;

riskScore = Math.min(Math.round(riskScore), 100);
```

**Expected Results with Fix:**
- Assembly (50% delay, critical): **90 points** ✅
- Packaging (33% delay, delayed): **68 points** ✅
- Material Prep (6.7% delay, delayed): **33 points** ✅

### FIX #2: Lower Default Threshold (CRITICAL)

**File:** `backend/routes/insights.js` (line 54)

**Current:**
```javascript
const { range = 'last1Hour', threshold = 60 } = req.query;
```

**Fixed:**
```javascript
const { range = 'last1Hour', threshold = 20 } = req.query;
```

**Impact:** Will show ALL processes with >20 risk score instead of filtering most out

### FIX #3: Fix InsightPanel to Use Working Endpoint (CRITICAL)

**File:** `src/components/InsightPanel.tsx` (line 420)

**Current (BROKEN):**
```typescript
const response = await fetchHighRiskInsights(backendRange);
```

**Fixed:**
```typescript
const response = await fetchProcesses({ range: backendRange });

// Calculate risk scores on frontend (same algorithm as backend fix #1)
const transformedInsights = response.data.map(process => {
  const delayPercentage = process.average_duration > 0
    ? ((process.actual_duration - process.average_duration) / process.average_duration) * 100
    : 0;
  
  const delayTime = process.actual_duration - process.average_duration;
  
  // Risk score calculation (matching backend)
  let riskScore = 0;
  const absDelayPercent = Math.abs(delayPercentage);
  if (absDelayPercent >= 50) riskScore += 50;
  else if (absDelayPercent >= 30) riskScore += 40;
  else if (absDelayPercent >= 20) riskScore += 30;
  else if (absDelayPercent >= 10) riskScore += 20;
  else riskScore += absDelayPercent;
  
  if (process.status === 'critical') riskScore += 40;
  else if (process.status === 'failed') riskScore += 35;
  else if (process.status === 'delayed') riskScore += 20;
  else if (process.status === 'in-progress') riskScore += 10;
  
  const delayMinutes = delayTime / 60;
  if (delayMinutes >= 60) riskScore += 10;
  else if (delayMinutes >= 30) riskScore += 7;
  else if (delayMinutes >= 15) riskScore += 5;
  else if (delayMinutes > 0) riskScore += 3;
  
  riskScore = Math.min(Math.round(riskScore), 100);
  
  // Determine risk level
  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };
  
  return {
    processName: process.name,
    processId: process.id,
    delayPercentage: Math.round(delayPercentage),
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    recommendation: generateRecommendation(riskScore, process.name),
    isPotentialBottleneck: riskScore >= 60,
    averageDuration: process.average_duration,
    actualDuration: process.actual_duration,
    delayTime,
    estimatedImpact: calculateEstimatedImpact(delayPercentage)
  };
});
```

### FIX #4: Improve Message Generation

**File:** `backend/routes/insights.js` (lines 122-131)

**Current:**
```javascript
let messageType = 'bottleneck';
if (riskScore >= 80) messageType = 'anomaly';
else if (delayPercentage >= 50) messageType = 'prediction';
else if (process.status === 'delayed') messageType = 'pattern';

const message = generateInsightMessage(processData, messageType);
```

**Fixed:**
```javascript
// Determine message type and priority based on status AND risk
let messageType = 'info';
if (process.status === 'critical' || riskScore >= 80) {
  messageType = 'critical';
} else if (process.status === 'failed' || riskScore >= 70) {
  messageType = 'urgent';
} else if (process.status === 'delayed' || riskScore >= 60) {
  messageType = 'warning';
} else if (riskScore >= 40) {
  messageType = 'attention';
}

const message = generateInsightMessage(processData, messageType);
```

**Update generateInsightMessage():**
```javascript
function generateInsightMessage(process, messageType) {
  const processName = process.process_name || process.processName || process.name;
  const delayPercent = Math.round(Math.abs(process.delay_percentage || process.delayPercentage || 0));
  const riskScore = Math.round(process.risk_score || process.riskScore || 0);
  
  const templates = {
    critical: `🔴 ${processName} running ${delayPercent}% behind — CRITICAL bottleneck detected (Risk: ${riskScore}/100)`,
    urgent: `🚨 ${processName} experiencing ${delayPercent}% delay — immediate attention required (Risk: ${riskScore}/100)`,
    warning: `⚠️ ${processName} delayed by ${delayPercent}% — resource constraint detected (Risk: ${riskScore}/100)`,
    attention: `📊 ${processName} showing ${delayPercent}% variance — monitor closely (Risk: ${riskScore}/100)`,
    info: `ℹ️ ${processName} operating normally — no issues detected`
  };
  
  return templates[messageType] || templates.info;
}
```

---

## 📊 EXPECTED RESULTS AFTER FIXES

### AI Insights Messages (for last6Hours):
```
💬 AI Recommendations (6 messages):

🔴 Assembly running 50% behind — CRITICAL bottleneck detected (Risk: 90/100)
⚠️ Packaging delayed by 33% — resource constraint detected (Risk: 68/100)
📊 Material Preparation showing 6% variance — monitor closely (Risk: 33/100)
📊 Receiving showing 5% variance — monitor closely (Risk: 30/100)
ℹ️ Quality Check operating normally — no issues detected
ℹ️ Dispatch operating normally — no issues detected
```

### Active Bottlenecks Cards:
```
Will show 6 cards (all processes), sorted by risk score:
1. Assembly (Risk: 90, Critical)
2. Packaging (Risk: 68, High)
3. Material Prep (Risk: 33, Medium)
4. Receiving (Risk: 30, Medium)
5. Quality Check (Risk: 0, Low)
6. Dispatch (Risk: 0, Low)
```

---

## 🎯 SUMMARY

**Root Causes:**
1. ❌ Risk score algorithm severely undervalues delays (gives 30 instead of 90)
2. ❌ Status "critical" not recognized, gets 0 bonus points
3. ❌ Threshold too high (60) filters out most processes
4. ❌ InsightPanel calls broken endpoint, can't display bottleneck cards
5. ❌ Message generation logic doesn't match severity

**Impact:**
- Users see 2 vague messages instead of 6 clear ones
- "No bottlenecks detected" when 3 critical processes failing
- Risk scores don't match visual chart status colors
- No detailed bottleneck cards, recommendations, or cost impact

**Priority:**
🔴 **CRITICAL** - Apply all 4 fixes immediately to restore functionality
