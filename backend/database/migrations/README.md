# 📋 Database Migrations Guide

## Overview

This directory contains SQL migration scripts to add the `timeframe` column to the `process_steps` table for better time-range filtering.

---

## 🗂️ Migration Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `001_add_timeframe_column.sql` | Adds timeframe column, indexes, constraints | **Run this first** |
| `002_seed_data_with_timeframes.sql` | Populates table with sample data | After migration |
| `001_add_timeframe_column_rollback.sql` | Removes timeframe column | If you need to undo |

---

## 🚀 How to Apply Migration

### Step 1: Apply Migration (Add Timeframe Column)

1. **Open Supabase SQL Editor:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in left sidebar

2. **Run Migration Script:**
   - Click **New Query**
   - Copy contents of `001_add_timeframe_column.sql`
   - Paste into editor
   - Click **Run** (or press F5)

3. **Verify Success:**
   ```sql
   -- Check if column exists
   SELECT column_name, data_type 
   FROM information_schema.columns
   WHERE table_name = 'process_steps' 
   AND column_name = 'timeframe';
   
   -- Should return: timeframe | text
   ```

### Step 2: Seed Data (Optional)

If you want fresh sample data with timeframes:

1. **Clear Existing Data (OPTIONAL):**
   ```sql
   TRUNCATE TABLE process_steps CASCADE;
   TRUNCATE TABLE insights CASCADE;
   ```

2. **Run Seed Script:**
   - Open `002_seed_data_with_timeframes.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click **Run**

3. **Verify Data:**
   ```sql
   -- Count by timeframe
   SELECT timeframe, COUNT(*) 
   FROM process_steps 
   GROUP BY timeframe;
   
   -- Expected:
   -- last1Hour    | 5
   -- last6Hours   | 11
   -- last24Hours  | 18
   -- last7Days    | 25
   ```

### Step 3: Update Backend API (If Needed)

The migration automatically updates existing records based on timestamp. Your backend API can now filter by timeframe:

```javascript
// Example: Filter by timeframe
const { data } = await supabase
  .from('process_steps')
  .select('*')
  .eq('timeframe', 'last1Hour');
```

---

## 🔄 Rollback (Undo Migration)

If you need to remove the timeframe column:

1. **Run Rollback Script:**
   - Open `001_add_timeframe_column_rollback.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click **Run**

2. **Verify Rollback:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns
   WHERE table_name = 'process_steps' 
   AND column_name = 'timeframe';
   
   -- Should return no rows
   ```

---

## 📊 What the Migration Does

### 1. Adds Timeframe Column
```sql
ALTER TABLE process_steps 
ADD COLUMN timeframe TEXT;
```

### 2. Creates Indexes for Performance
```sql
CREATE INDEX idx_process_steps_timeframe ON process_steps(timeframe);
CREATE INDEX idx_process_steps_timeframe_timestamp ON process_steps(timeframe, timestamp DESC);
```

### 3. Updates Existing Records
Automatically assigns timeframes based on timestamp:
- Records < 1 hour old → `'last1Hour'`
- Records < 6 hours old → `'last6Hours'`
- Records < 24 hours old → `'last24Hours'`
- Records < 7 days old → `'last7Days'`
- Older records → `'older'`

### 4. Adds Validation Constraint
```sql
CHECK (timeframe IN ('last1Hour', 'last6Hours', 'last24Hours', 'last7Days', 'older', NULL))
```

---

## 💡 Timeframe Values

| Value | Description | Use Case |
|-------|-------------|----------|
| `last1Hour` | Most recent data | Real-time monitoring |
| `last6Hours` | Recent history | Short-term trends |
| `last24Hours` | Daily view | Day analysis |
| `last7Days` | Weekly view | Long-term patterns |
| `older` | Historical data | Archive |

---

## 🧪 Testing Queries

### Count Records by Timeframe
```sql
SELECT 
    timeframe,
    COUNT(*) as count,
    MIN(timestamp) as oldest,
    MAX(timestamp) as newest
FROM process_steps
GROUP BY timeframe
ORDER BY 
    CASE timeframe
        WHEN 'last1Hour' THEN 1
        WHEN 'last6Hours' THEN 2
        WHEN 'last24Hours' THEN 3
        WHEN 'last7Days' THEN 4
        ELSE 5
    END;
```

### Get Recent Processes by Timeframe
```sql
-- Last 1 hour only
SELECT * FROM process_steps 
WHERE timeframe = 'last1Hour'
ORDER BY timestamp DESC;

-- Last 24 hours
SELECT * FROM process_steps 
WHERE timeframe IN ('last1Hour', 'last6Hours', 'last24Hours')
ORDER BY timestamp DESC;
```

### Check Bottlenecks by Timeframe
```sql
SELECT 
    timeframe,
    name,
    COUNT(*) as occurrences,
    AVG(actual_duration - average_duration) as avg_delay
FROM process_steps
WHERE actual_duration > average_duration
GROUP BY timeframe, name
ORDER BY avg_delay DESC;
```

---

## 🔧 Backend Integration

### Update Process Routes

After migration, you can filter by timeframe directly:

```javascript
// backend/routes/processes.js

// Option 1: Filter by timeframe column (NEW - More Efficient!)
router.get('/delayed', async (req, res) => {
  const { range = 'all' } = req.query;
  
  let query = supabase
    .from('process_steps')
    .select('*')
    .gte('actual_duration', 'average_duration');
  
  // Filter by timeframe column instead of timestamp calculation
  if (range !== 'all') {
    query = query.eq('timeframe', range);
  }
  
  const { data, error } = await query;
  // ... rest of code
});

// Option 2: Keep timestamp-based filtering (EXISTING - Still works!)
// No changes needed - both methods work!
```

---

## 📈 Sample Data Distribution

After running seed script:

```
last1Hour:    5 processes  (most recent, real-time data)
last6Hours:   11 processes (recent history)
last24Hours:  18 processes (daily trends)
last7Days:    25 processes (weekly patterns)
---------------------------------------------------------
Total:        ~60 process records
Insights:     ~15 records (high-risk processes)
```

**Process Types:**
- Material Preparation (5 processes)
- Assembly Line (5 processes)
- Quality Check (5 processes)
- Packaging (5 processes) - Shows increasing delays
- Dispatch (5 processes) - Critical bottleneck pattern

---

## ✅ Verification Checklist

After running migration:

- [ ] `timeframe` column exists in `process_steps` table
- [ ] Indexes created (check with `\d process_steps` in psql)
- [ ] Existing records have timeframe values assigned
- [ ] Constraint prevents invalid timeframe values
- [ ] Sample data seed successful (if ran seed script)
- [ ] Backend API can filter by timeframe
- [ ] Dashboard shows correct data per time range

---

## 🐛 Troubleshooting

### Issue: "Column already exists"
**Solution:** Skip to Step 2 (seed data) or verify column with:
```sql
SELECT * FROM process_steps LIMIT 1;
```

### Issue: "No data returned"
**Solution:** Run seed script `002_seed_data_with_timeframes.sql`

### Issue: "Constraint violation"
**Solution:** Ensure timeframe values are one of:
- `'last1Hour'`
- `'last6Hours'`
- `'last24Hours'`
- `'last7Days'`
- `'older'`
- `NULL`

### Issue: "Index already exists"
**Solution:** Indexes were already created. Safe to ignore.

---

## 📝 Notes

- Migration is **idempotent** - safe to run multiple times
- Existing data is preserved and automatically updated
- Backend API works with both old and new approaches
- Rollback available if needed
- Indexes improve query performance significantly

---

## 🚦 Next Steps

After applying migration:

1. ✅ Run migration script
2. ✅ Verify column exists
3. ✅ Seed sample data (optional)
4. ✅ Test backend API queries
5. ✅ Verify dashboard shows correct data
6. ✅ Consider updating backend to use `timeframe` column for better performance

---

**Migration Status: READY TO APPLY** ✅

Run `001_add_timeframe_column.sql` in Supabase SQL Editor to get started!
