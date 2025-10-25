-- ============================================
-- VERIFICATION QUERIES
-- Run these after executing schema.sql
-- ============================================

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('process_steps', 'insights')
ORDER BY table_name;

-- Expected output: 2 rows (insights, process_steps)

-- 2. Count records in each table
SELECT 
  'process_steps' as table_name,
  COUNT(*) as row_count
FROM process_steps
UNION ALL
SELECT 
  'insights' as table_name,
  COUNT(*) as row_count
FROM insights;

-- Expected output: 
-- process_steps: 15
-- insights: 8

-- 3. View sample process steps
SELECT 
  name,
  average_duration,
  actual_duration,
  actual_duration - average_duration as variance,
  status,
  timestamp
FROM process_steps
ORDER BY timestamp DESC
LIMIT 10;

-- 4. View sample insights
SELECT 
  risk_score,
  recommendation,
  timestamp
FROM insights
ORDER BY risk_score DESC
LIMIT 5;

-- 5. Check for delayed processes
SELECT 
  name,
  COUNT(*) as delay_count
FROM process_steps
WHERE status = 'delayed'
GROUP BY name
ORDER BY delay_count DESC;

-- Expected output: Each process should have 1 delayed entry

-- 6. Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('process_steps', 'insights');

-- Expected output: Both tables should have rowsecurity = true

-- 7. Check indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('process_steps', 'insights')
ORDER BY tablename, indexname;

-- Expected output: Multiple indexes for both tables

-- ============================================
-- If all queries return expected results:
-- ✅ Database setup is COMPLETE!
-- ✅ Ready to proceed to API implementation
-- ============================================
