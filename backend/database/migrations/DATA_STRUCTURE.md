# 📊 Data Structure Visualization

## What You're Getting: 24 Unique Records

```
┌─────────────────────────────────────────────────────────────────────┐
│                    6 PROCESSES × 4 TIME RANGES = 24 ROWS            │
└─────────────────────────────────────────────────────────────────────┘

Process Name            │ last1Hour │ last6Hours │ last24Hours │ last7Days │
════════════════════════╪═══════════╪════════════╪═════════════╪═══════════╡
Material Preparation    │     ✓     │      ✓     │      ✓      │     ✓     │
Receiving               │     ✓     │      ✓     │      ✓      │     ✓     │
Quality Check           │     ✓     │      ✓     │      ✓      │     ✓     │
Assembly                │     ✓     │      ✓     │      ✓      │     ✓     │
Packaging               │     ✓     │      ✓     │      ✓      │     ✓     │
Dispatch                │     ✓     │      ✓     │      ✓      │     ✓     │
────────────────────────┴───────────┴────────────┴─────────────┴───────────┘
         TOTAL:            6 rows  │   6 rows   │   6 rows    │  6 rows   │
                              = 24 unique records total
```

---

## Sample Data Preview

### Material Preparation (4 variants)
```sql
| name                 | time_range   | avg_dur | actual_dur | delay | status    |
|----------------------|--------------|---------|------------|-------|-----------|
| Material Preparation | last1Hour    | 900s    | 840s       | -60s  | completed |
| Material Preparation | last6Hours   | 900s    | 960s       | +60s  | delayed   |
| Material Preparation | last24Hours  | 900s    | 1080s      | +180s | delayed   |
| Material Preparation | last7Days    | 900s    | 870s       | -30s  | completed |
```

### Packaging (4 variants) - Shows bottleneck
```sql
| name      | time_range   | avg_dur | actual_dur | delay | status    |
|-----------|--------------|---------|------------|-------|-----------|
| Packaging | last1Hour    | 360s    | 540s       | +180s | delayed   | ⚠️
| Packaging | last6Hours   | 360s    | 480s       | +120s | delayed   | ⚠️
| Packaging | last24Hours  | 360s    | 330s       | -30s  | completed |
| Packaging | last7Days    | 360s    | 390s       | +30s  | completed |
```

### Dispatch (4 variants) - Critical bottleneck
```sql
| name     | time_range   | avg_dur | actual_dur | delay | status   |
|----------|--------------|---------|------------|-------|----------|
| Dispatch | last1Hour    | 720s    | 1260s      | +540s | critical | 🔴
| Dispatch | last6Hours   | 720s    | 690s       | -30s  | completed|
| Dispatch | last24Hours  | 720s    | 720s       | 0s    | completed|
| Dispatch | last7Days    | 720s    | 780s       | +60s  | delayed  |
```

---

## Query Examples & Expected Results

### ✅ Query 1: Get all processes for last 1 hour
```sql
SELECT * FROM process_steps WHERE time_range = 'last1Hour';
```
**Returns:** 6 rows (Material Prep, Receiving, Quality Check, Assembly, Packaging, Dispatch)

---

### ✅ Query 2: Get all time variants for Packaging
```sql
SELECT * FROM process_steps WHERE name = 'Packaging';
```
**Returns:** 4 rows (last1Hour, last6Hours, last24Hours, last7Days)

---

### ✅ Query 3: Get specific process + time range
```sql
SELECT * FROM process_steps 
WHERE name = 'Dispatch' AND time_range = 'last1Hour';
```
**Returns:** 1 row (Dispatch critical bottleneck in last hour)

---

### ✅ Query 4: Find all bottlenecks in last 6 hours
```sql
SELECT name, actual_duration, average_duration, 
       actual_duration - average_duration as delay
FROM process_steps 
WHERE time_range = 'last6Hours' 
  AND actual_duration > average_duration
ORDER BY delay DESC;
```
**Returns:** All delayed processes in 6-hour window

---

## UNIQUE Constraint

Each combination is unique:
```sql
UNIQUE(name, time_range)
```

This means:
- ✅ Can have: `Packaging + last1Hour`
- ✅ Can have: `Packaging + last6Hours`
- ❌ Cannot have: Two records of `Packaging + last1Hour`

---

## Complete Record Structure

```javascript
{
  id: "uuid-123...",                    // Auto-generated UUID
  name: "Packaging",                    // Process name
  time_range: "last1Hour",              // Time category
  average_duration: 360,                // Expected time (seconds)
  actual_duration: 540,                 // Actual time (seconds)
  status: "delayed",                    // completed/delayed/critical
  timestamp: "2025-10-25T14:30:00Z",   // When recorded
  created_at: "2025-10-25T14:30:00Z",
  updated_at: "2025-10-25T14:30:00Z"
}
```

---

## Data Validation After Insert

Run this to verify structure:
```sql
-- Should return 24
SELECT COUNT(*) FROM process_steps;

-- Should return 6 processes, each with count=4
SELECT name, COUNT(*) 
FROM process_steps 
GROUP BY name;

-- Should return 4 time ranges, each with count=6
SELECT time_range, COUNT(*) 
FROM process_steps 
GROUP BY time_range;
```

---

## Status Legend

| Status     | Meaning | Condition |
|------------|---------|-----------|
| `completed` | ✅ On time or early | actual ≤ average |
| `delayed` | ⚠️ Moderate delay | actual > average (up to 50%) |
| `critical` | 🔴 Severe bottleneck | actual > average (50%+) |

---

## Bottleneck Patterns in Data

### 🟢 Healthy Processes:
- Material Preparation (mostly on time)
- Receiving (stable across time ranges)

### 🟡 Warning Processes:
- Quality Check (some delays)
- Assembly (occasional spikes)

### 🔴 Critical Bottlenecks:
- **Packaging** - Consistent delays in recent hours
- **Dispatch** - Critical 75% delay in last hour!

---

## Your Frontend Can Now Query:

```javascript
// Get data for "Last 1 Hour" filter
const response = await fetch('/api/processes?range=last1Hour');
// Returns: 6 processes with their last1Hour data

// Get data for "Last 24 Hours" filter  
const response = await fetch('/api/processes?range=last24Hours');
// Returns: 6 processes with their last24Hours data

// Get specific process across all time ranges
const response = await fetch('/api/processes?name=Packaging');
// Returns: 4 records (one per time range)

// Get one specific record
const response = await fetch('/api/processes?name=Dispatch&range=last1Hour');
// Returns: 1 record (Dispatch in last hour)
```

---

## ✅ Success Criteria

After running the migration script, you should see:

- [x] Exactly 24 records in `process_steps` table
- [x] Each process (6) appears exactly 4 times (once per time range)
- [x] Each time range (4) has exactly 6 processes
- [x] No duplicate (process_name + time_range) combinations
- [x] Query by time_range works perfectly
- [x] Query by process name works perfectly
- [x] Data is clean and structured

---

**This is what you'll get after running `002_seed_data_with_timeframes.sql`!** 🎉
