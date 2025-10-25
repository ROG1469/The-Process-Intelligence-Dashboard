# 🚀 Process & Insights API Testing Guide

## Stage 2.1.4 - Process Data API Endpoints

Base URL: `http://localhost:5000`

---

## 📊 Process Endpoints

### 1. GET /api/processes
**Get all process steps with optional filtering**

**Query Parameters:**
- `range`: `last1Hour` | `last6Hours` | `last24Hours` | `last7Days`
- `status`: `completed` | `in-progress` | `delayed` | `failed`
- `name`: Process name (e.g., "Material Prep", "Assembly")

**Examples:**

```bash
# Get all processes
curl http://localhost:5000/api/processes

# Get processes from last 24 hours
curl http://localhost:5000/api/processes?range=last24Hours

# Get only delayed processes
curl http://localhost:5000/api/processes?status=delayed

# Get Material Prep processes from last 6 hours
curl "http://localhost:5000/api/processes?range=last6Hours&name=Material Prep"
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "stats": {
    "total": 15,
    "completed": 9,
    "delayed": 5,
    "inProgress": 1,
    "failed": 0
  },
  "filters": {
    "range": "last24Hours",
    "status": "all",
    "name": "all"
  },
  "data": [
    {
      "id": "uuid",
      "name": "Material Prep",
      "average_duration": 300,
      "actual_duration": 450,
      "status": "delayed",
      "timestamp": "2025-10-25T12:00:00Z"
    }
  ]
}
```

---

### 2. GET /api/processes/delayed
**Get only delayed processes (bottlenecks)**

**Query Parameters:**
- `range`: `last1Hour` | `last6Hours` | `last24Hours` | `last7Days`

**Examples:**

```bash
# Get all delayed processes
curl http://localhost:5000/api/processes/delayed

# Get delayed processes from last hour
curl http://localhost:5000/api/processes/delayed?range=last1Hour
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "range": "all",
  "data": [
    {
      "id": "uuid",
      "name": "Packaging",
      "average_duration": 240,
      "actual_duration": 360,
      "status": "delayed",
      "timestamp": "2025-10-25T12:00:00Z",
      "delay_seconds": 120,
      "delay_percentage": 50
    }
  ]
}
```

---

### 3. GET /api/processes/summary
**Get summary statistics by process name**

**Query Parameters:**
- `range`: `last1Hour` | `last6Hours` | `last24Hours` | `last7Days`

**Examples:**

```bash
# Get summary for all processes
curl http://localhost:5000/api/processes/summary

# Get summary for last 24 hours
curl http://localhost:5000/api/processes/summary?range=last24Hours
```

**Response:**
```json
{
  "success": true,
  "range": "all",
  "total_processes": 5,
  "data": [
    {
      "name": "Material Prep",
      "total_runs": 3,
      "completed": 2,
      "delayed": 1,
      "in_progress": 0,
      "failed": 0,
      "avg_duration": 350,
      "max_duration": 450,
      "min_duration": 280,
      "total_delay": 150
    }
  ]
}
```

---

### 4. GET /api/processes/:id
**Get a specific process by ID with related insights**

**Examples:**

```bash
# Replace {id} with actual UUID from your data
curl http://localhost:5000/api/processes/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Assembly",
    "average_duration": 600,
    "actual_duration": 720,
    "status": "delayed",
    "timestamp": "2025-10-25T12:00:00Z",
    "insights": [
      {
        "id": "uuid",
        "risk_score": 85,
        "recommendation": "Assembly line bottleneck detected...",
        "timestamp": "2025-10-25T12:05:00Z"
      }
    ]
  }
}
```

---

### 5. POST /api/processes
**Create a new process step**

**Body:**
```json
{
  "name": "Quality Check",
  "average_duration": 180,
  "actual_duration": 210,
  "status": "completed"
}
```

**Example:**

```bash
curl -X POST http://localhost:5000/api/processes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quality Check",
    "average_duration": 180,
    "actual_duration": 210,
    "status": "completed"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Process created successfully",
  "data": {
    "id": "new-uuid",
    "name": "Quality Check",
    "average_duration": 180,
    "actual_duration": 210,
    "status": "completed",
    "timestamp": "2025-10-25T12:30:00Z"
  }
}
```

---

## 💡 Insights Endpoints

### 1. GET /api/insights
**Get all AI insights with optional filtering**

**Query Parameters:**
- `range`: `last1Hour` | `last6Hours` | `last24Hours` | `last7Days`
- `minRisk`: Minimum risk score (0-100)

**Examples:**

```bash
# Get all insights
curl http://localhost:5000/api/insights

# Get insights with risk >= 70
curl http://localhost:5000/api/insights?minRisk=70

# Get high-risk insights from last 24 hours
curl "http://localhost:5000/api/insights?range=last24Hours&minRisk=80"
```

**Response:**
```json
{
  "success": true,
  "count": 8,
  "filters": {
    "range": "all",
    "minRisk": 70
  },
  "data": [
    {
      "id": "uuid",
      "process_id": "uuid",
      "risk_score": 92,
      "recommendation": "Critical delay in packaging...",
      "timestamp": "2025-10-25T12:00:00Z",
      "process_steps": {
        "id": "uuid",
        "name": "Packaging",
        "status": "delayed",
        "actual_duration": 360,
        "average_duration": 240
      }
    }
  ]
}
```

---

### 2. GET /api/insights/high-risk
**Get high-risk insights (risk score >= 70)**

**Query Parameters:**
- `range`: `last1Hour` | `last6Hours` | `last24Hours` | `last7Days`

**Examples:**

```bash
# Get all high-risk insights
curl http://localhost:5000/api/insights/high-risk

# Get high-risk from last hour
curl http://localhost:5000/api/insights/high-risk?range=last1Hour
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "range": "all",
  "data": [
    {
      "id": "uuid",
      "risk_score": 92,
      "recommendation": "Critical delay in packaging. Recommend immediate supervisor review...",
      "timestamp": "2025-10-25T12:00:00Z",
      "process_steps": {
        "name": "Packaging",
        "status": "delayed"
      }
    }
  ]
}
```

---

### 3. GET /api/insights/:id
**Get a specific insight by ID**

**Examples:**

```bash
# Replace {id} with actual UUID
curl http://localhost:5000/api/insights/{id}
```

---

### 4. POST /api/insights
**Create a new insight**

**Body:**
```json
{
  "process_id": "uuid-optional",
  "risk_score": 75,
  "recommendation": "Consider adding additional resources during peak hours."
}
```

**Example:**

```bash
curl -X POST http://localhost:5000/api/insights \
  -H "Content-Type: application/json" \
  -d '{
    "risk_score": 75,
    "recommendation": "Consider adding additional resources during peak hours."
  }'
```

---

## 🧪 Testing Workflow

### 1. Start the Server
```bash
cd C:\coding\aiprocessbottleneckdetector1\backend
npm run dev
```

### 2. Test Each Endpoint

**Quick Test Script (PowerShell):**
```powershell
# Test processes endpoint
Invoke-RestMethod http://localhost:5000/api/processes

# Test with time range
Invoke-RestMethod "http://localhost:5000/api/processes?range=last24Hours"

# Test delayed processes
Invoke-RestMethod http://localhost:5000/api/processes/delayed

# Test summary
Invoke-RestMethod http://localhost:5000/api/processes/summary

# Test insights
Invoke-RestMethod http://localhost:5000/api/insights

# Test high-risk insights
Invoke-RestMethod http://localhost:5000/api/insights/high-risk
```

---

## ✅ Success Criteria

- [ ] GET /api/processes returns 15 records
- [ ] GET /api/processes?status=delayed returns 5 records
- [ ] GET /api/processes?range=last24Hours filters correctly
- [ ] GET /api/processes/delayed shows delay_seconds and delay_percentage
- [ ] GET /api/processes/summary groups by process name
- [ ] GET /api/insights returns 8 records
- [ ] GET /api/insights?minRisk=70 filters by risk score
- [ ] GET /api/insights/high-risk returns insights >= 70
- [ ] POST /api/processes creates new record
- [ ] POST /api/insights creates new insight

---

## 🔗 Frontend Integration

**Example Frontend Code:**

```javascript
// Fetch processes from last 24 hours
const response = await fetch('http://localhost:5000/api/processes?range=last24Hours');
const { data, stats } = await response.json();

// Fetch delayed processes
const bottlenecks = await fetch('http://localhost:5000/api/processes/delayed');
const { data: delayedData } = await bottlenecks.json();

// Fetch high-risk insights
const insights = await fetch('http://localhost:5000/api/insights/high-risk');
const { data: insightData } = await insights.json();
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Durations are in seconds
- Risk scores range from 0-100
- Time ranges are relative to current time
- Queries return most recent data first (ordered by timestamp DESC)

---

**Status:** ✅ Stage 2.1.4 COMPLETE - Ready for frontend integration!
