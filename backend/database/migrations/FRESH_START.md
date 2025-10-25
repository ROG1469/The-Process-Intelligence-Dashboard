# 🚀 FRESH START - Setup Guide

**You deleted the old table, so follow these steps to rebuild everything:**

---

## Step 1: Create Tables ⚙️

📂 Open file: `000_create_tables.sql`

```
✅ This creates:
   - process_steps table (with all columns including timeframe/time_range)
   - insights table
   - All indexes and constraints
```

**In Supabase SQL Editor:**
1. Copy contents of `000_create_tables.sql`
2. Paste into SQL Editor
3. Click **RUN** ▶️
4. Wait for success message: ✅ Tables created successfully!

---

## Step 2: Populate Data 📊

📂 Open file: `002_seed_data_with_timeframes.sql`

```
✅ This inserts:
   - 24 unique records (6 processes × 4 time ranges)
   - AI-generated insights
   - Verification queries
```

**In Supabase SQL Editor:**
1. Copy contents of `002_seed_data_with_timeframes.sql`
2. Paste into SQL Editor
3. Click **RUN** ▶️
4. Wait for success message: ✅ Inserted 24 structured records!

---

## Step 3: Verify ✅

Run this query in Supabase:

```sql
-- Should return 24
SELECT COUNT(*) FROM process_steps;

-- Should show 6 rows (one per process), each with count=4
SELECT name, COUNT(*) as time_ranges
FROM process_steps
GROUP BY name
ORDER BY name;

-- Should show 4 rows (one per time range), each with count=6
SELECT time_range, COUNT(*) as processes
FROM process_steps
GROUP BY time_range
ORDER BY time_range;
```

**Expected Results:**
```
Total: 24 records
Each process: 4 time ranges
Each time range: 6 processes
```

---

## Step 4: Test Your API 🧪

Open PowerShell and run:

```powershell
# Test: Get all processes for last 1 hour
Invoke-RestMethod 'http://localhost:5000/api/processes?range=last1Hour'

# Should return 6 processes
```

---

## 📁 File Order

Run these in order:

```
1. ✅ 000_create_tables.sql          ← START HERE (creates tables)
2. ✅ 002_seed_data_with_timeframes.sql  ← THEN THIS (populates data)
3. ✅ Verify with queries above
```

---

## 🔧 Troubleshooting

### Error: "relation process_steps does not exist"
**Solution:** Run `000_create_tables.sql` first!

### Error: "duplicate key value violates unique constraint"
**Solution:** Uncomment TRUNCATE lines in `002_seed_data_with_timeframes.sql`

### Error: "column timeframe does not exist"
**Solution:** The new table uses `time_range` (not `timeframe`)

---

## ✨ What You'll Get

After running both scripts:

```
process_steps table:
┌──────────────────────┬─────────────┬─────────┬──────────┬──────────┐
│ name                 │ time_range  │ avg_dur │ act_dur  │ status   │
├──────────────────────┼─────────────┼─────────┼──────────┼──────────┤
│ Material Preparation │ last1Hour   │ 900s    │ 840s     │ completed│
│ Material Preparation │ last6Hours  │ 900s    │ 960s     │ delayed  │
│ Material Preparation │ last24Hours │ 900s    │ 1080s    │ delayed  │
│ Material Preparation │ last7Days   │ 900s    │ 870s     │ completed│
│ Receiving            │ last1Hour   │ 600s    │ 570s     │ completed│
│ Receiving            │ last6Hours  │ 600s    │ 720s     │ delayed  │
│ ...                  │ ...         │ ...     │ ...      │ ...      │
│ Dispatch             │ last1Hour   │ 720s    │ 1260s    │ critical │ 🔴
└──────────────────────┴─────────────┴─────────┴──────────┴──────────┘
                     TOTAL: 24 unique records
```

---

## 🎯 Ready!

Your database will be:
- ✅ Clean structure (24 unique records)
- ✅ No duplicates (UNIQUE constraint on name + time_range)
- ✅ Properly indexed for fast queries
- ✅ Ready for frontend filtering

**Next:** Test your dashboard at http://localhost:3000/dashboard 🚀
