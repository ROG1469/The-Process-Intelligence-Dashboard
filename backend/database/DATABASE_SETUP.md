# 🗄️ Database Setup Guide - Supabase

## 📋 Step-by-Step Instructions

### 1️⃣ Open Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project: **naxuqkqpbqdnqunmubbz**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

### 2️⃣ Run the Schema SQL

1. Open the file: `backend/database/schema.sql`
2. **Copy the entire SQL content**
3. **Paste** into the Supabase SQL Editor
4. Click **RUN** button (or press Ctrl+Enter)

### 3️⃣ Verify Success

You should see messages like:
```
✅ Database schema created successfully!
✅ Tables created: process_steps, insights
✅ Sample data seeded: 15 process steps, 8 insights
```

### 4️⃣ View Your Data

#### Option A: Table Editor (Visual)
1. Click **Table Editor** in left sidebar
2. You'll see two tables:
   - `process_steps` (15 rows)
   - `insights` (8 rows)
3. Click each table to view the data

#### Option B: SQL Query
Run these queries in SQL Editor:

```sql
-- View all process steps
SELECT * FROM process_steps ORDER BY timestamp DESC;

-- View all insights
SELECT * FROM insights ORDER BY risk_score DESC;

-- View processes with delays
SELECT 
  name, 
  status, 
  actual_duration - average_duration as delay_seconds,
  timestamp
FROM process_steps 
WHERE status = 'delayed'
ORDER BY timestamp DESC;
```

---

## 📊 Database Schema Overview

### Table: `process_steps`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | VARCHAR(255) | Process name (Material Prep, Assembly, etc.) |
| `average_duration` | INTEGER | Expected duration in seconds |
| `actual_duration` | INTEGER | Actual duration in seconds |
| `status` | VARCHAR(50) | completed, in-progress, delayed, failed |
| `timestamp` | TIMESTAMPTZ | When the process occurred |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

### Table: `insights`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `process_id` | UUID | Foreign key to process_steps (nullable) |
| `risk_score` | INTEGER | Risk level 0-100 |
| `recommendation` | TEXT | AI-generated recommendation |
| `timestamp` | TIMESTAMPTZ | When insight was generated |
| `created_at` | TIMESTAMPTZ | Record creation time |

---

## 📦 Seeded Sample Data

### Process Steps (15 entries)

**Material Prep:**
- ✅ Completed: 280s (expected: 300s)
- ⚠️ Delayed: 450s (expected: 300s) - 150s over
- ✅ Completed: 320s (expected: 300s)

**Assembly:**
- ✅ Completed: 580s (expected: 600s)
- ⚠️ Delayed: 720s (expected: 600s) - 120s over
- 🔄 In Progress: 650s (expected: 600s)

**Quality Check:**
- ✅ Completed: 170s (expected: 180s)
- ⚠️ Delayed: 240s (expected: 180s) - 60s over
- ✅ Completed: 190s (expected: 180s)

**Packaging:**
- ✅ Completed: 230s (expected: 240s)
- ⚠️ Delayed: 360s (expected: 240s) - 120s over
- 🔄 In Progress: 250s (expected: 240s)

**Dispatch:**
- ✅ Completed: 400s (expected: 420s)
- ⚠️ Delayed: 540s (expected: 420s) - 120s over
- ✅ Completed: 430s (expected: 420s)

### Insights (8 entries)

Each delayed process has an associated insight with:
- Risk scores ranging from 68-92
- Specific recommendations for improvement
- Plus 3 general workflow insights

---

## 🔒 Security Features

### Row Level Security (RLS) Enabled

The schema includes RLS policies that:
- ✅ Allow authenticated users to read all data
- ✅ Allow authenticated users to insert new records
- ✅ Allow authenticated users to update records
- ❌ Block unauthenticated access

This ensures your API endpoints will work correctly with Supabase Auth.

---

## 🧪 Testing Queries

### Find all bottlenecks (delayed processes):
```sql
SELECT 
  name,
  actual_duration - average_duration as delay_seconds,
  ROUND((actual_duration - average_duration)::numeric / average_duration * 100, 2) as delay_percentage,
  status,
  timestamp
FROM process_steps
WHERE actual_duration > average_duration
ORDER BY delay_seconds DESC;
```

### Get high-risk insights:
```sql
SELECT 
  risk_score,
  recommendation,
  timestamp
FROM insights
WHERE risk_score >= 70
ORDER BY risk_score DESC;
```

### Process performance summary:
```sql
SELECT 
  name,
  COUNT(*) as total_runs,
  AVG(actual_duration) as avg_actual,
  MAX(actual_duration) as max_duration,
  MIN(actual_duration) as min_duration,
  COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_count
FROM process_steps
GROUP BY name
ORDER BY delayed_count DESC;
```

---

## ✅ Verification Checklist

Before proceeding to API implementation:

- [ ] SQL executed successfully in Supabase
- [ ] `process_steps` table shows 15 rows
- [ ] `insights` table shows 8 rows
- [ ] Can view data in Table Editor
- [ ] RLS policies are enabled
- [ ] Indexes created successfully
- [ ] Sample data includes all 5 process types
- [ ] Some processes show "delayed" status
- [ ] Insights have risk scores and recommendations

---

## 🚀 What's Next?

Once your database is set up and verified:

1. **Stage 2.1.4:** Create API endpoints to fetch this data
   - `GET /api/processes` - Get all process steps
   - `GET /api/insights` - Get AI insights
   - `GET /api/bottlenecks` - Get delayed processes

2. **Connect Frontend:** Update the dashboard to fetch real data from your API

3. **Real-time Updates:** Add subscriptions for live data updates

---

## 📝 Notes

- All timestamps are in UTC (TIMESTAMPTZ)
- Durations are stored in seconds
- UUIDs are auto-generated for all IDs
- Foreign keys have CASCADE delete (deleting a process deletes its insights)
- The schema includes indexes for better query performance

---

**Ready?** Copy the SQL from `backend/database/schema.sql` and run it in Supabase! 🎯
