# 🚀 QUICK START: Timeframe Migration

## 📋 3 Simple Steps

### Step 1️⃣: Add Timeframe Column (Required)

1. Open **Supabase SQL Editor**
2. Copy & paste: `backend/database/migrations/001_add_timeframe_column.sql`
3. Click **Run**
4. ✅ Done! Column added with indexes

**What it does:**
- Adds `timeframe` column (text)
- Creates performance indexes
- Updates existing records automatically
- Adds validation constraint

---

### Step 2️⃣: Add Sample Data (Optional)

1. **Keep existing data?** 
   - Skip lines 8-9 in the seed script
   
2. **Start fresh?**
   - Uncomment lines 8-9: `TRUNCATE TABLE process_steps CASCADE;`

3. Copy & paste: `backend/database/migrations/002_seed_data_with_timeframes.sql`
4. Click **Run**
5. ✅ Done! ~60 records with timeframes added

**What you get:**
- 5 processes in `last1Hour`
- 11 processes in `last6Hours`
- 18 processes in `last24Hours`
- 25 processes in `last7Days`
- 15 insights for high-risk processes

---

### Step 3️⃣: Verify (Recommended)

Run this query in Supabase:

```sql
-- Check timeframe distribution
SELECT 
    timeframe, 
    COUNT(*) as count 
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

**Expected output:**
```
timeframe    | count
-------------+-------
last1Hour    |     5
last6Hours   |    11
last24Hours  |    18
last7Days    |    25
```

---

## 🔍 Test Your Dashboard

After migration, test the time filters:

1. Open: http://localhost:3000/dashboard
2. Select **Last 1 hour** → Should show 5 processes
3. Select **Last 6 hours** → Should show 16 processes (5+11)
4. Select **Last 24 hours** → Should show 34 processes (5+11+18)
5. Select **Last 7 days** → Should show 59 processes (all)

---

## 🎯 Timeframe Values

| Value | Description | Records | Use For |
|-------|-------------|---------|---------|
| `last1Hour` | < 1 hour ago | 5 | Real-time monitoring |
| `last6Hours` | < 6 hours ago | 11 | Recent trends |
| `last24Hours` | < 24 hours ago | 18 | Daily analysis |
| `last7Days` | < 7 days ago | 25 | Weekly patterns |

---

## ⚡ Quick Commands

```sql
-- See all timeframes
SELECT DISTINCT timeframe FROM process_steps;

-- Get last 1 hour data
SELECT * FROM process_steps WHERE timeframe = 'last1Hour';

-- Count bottlenecks by timeframe
SELECT 
    timeframe,
    COUNT(*) as bottlenecks
FROM process_steps
WHERE actual_duration > average_duration
GROUP BY timeframe;

-- Recent high-risk processes
SELECT 
    p.name, 
    p.timeframe, 
    i.risk_score 
FROM process_steps p
JOIN insights i ON p.id = i.process_id
WHERE p.timeframe = 'last1Hour'
ORDER BY i.risk_score DESC;
```

---

## 🔄 Need to Undo?

Run the rollback script:
```
backend/database/migrations/001_add_timeframe_column_rollback.sql
```

---

## ✅ Success Criteria

- [x] Column `timeframe` exists
- [x] Data has timeframe values assigned
- [x] Dashboard filters work correctly
- [x] Backend API returns filtered data
- [x] Performance improved (indexes working)

---

## 📞 Files Location

```
backend/database/migrations/
├── 001_add_timeframe_column.sql          ← RUN THIS FIRST
├── 002_seed_data_with_timeframes.sql     ← OPTIONAL: Sample data
├── 001_add_timeframe_column_rollback.sql ← UNDO if needed
└── README.md                             ← Full documentation
```

---

**Ready to start? Run `001_add_timeframe_column.sql` in Supabase now!** 🚀
