-- ============================================================================
-- SEED DATA: Process Steps with Timeframe Categories (CLEAN STRUCTURE)
-- Purpose: Populate process_steps with 24 unique records (6 processes × 4 time ranges)
-- Date: 2025-10-25
-- ============================================================================

-- STEP 1: (Optional) Clear existing data if re-running
-- ============================================================================
-- Note: Skip this if running on a freshly created table
-- Uncomment the lines below if you need to clear existing data:

-- TRUNCATE TABLE process_steps CASCADE;
-- TRUNCATE TABLE insights CASCADE;

DO $$ 
BEGIN
    RAISE NOTICE '� Populating process_steps with 24 structured records...';
END $$;

-- STEP 2: Insert 24 structured records (6 processes × 4 time ranges)
-- ============================================================================
-- Each process has EXACTLY ONE record per time range
-- Duration values in SECONDS (converted from milliseconds)
-- Status: 'completed', 'delayed', 'on-track', 'critical'
-- ============================================================================

-- Material Preparation (4 time ranges)
INSERT INTO process_steps (name, time_range, average_duration, actual_duration, status, timestamp)
VALUES
    ('Material Preparation', 'last1Hour', 900, 840, 'completed', NOW() - INTERVAL '15 minutes'),
    ('Material Preparation', 'last6Hours', 900, 960, 'delayed', NOW() - INTERVAL '2 hours'),
    ('Material Preparation', 'last24Hours', 900, 1080, 'delayed', NOW() - INTERVAL '8 hours'),
    ('Material Preparation', 'last7Days', 900, 870, 'completed', NOW() - INTERVAL '3 days');

-- Receiving (4 time ranges)
INSERT INTO process_steps (name, time_range, average_duration, actual_duration, status, timestamp)
VALUES
    ('Receiving', 'last1Hour', 600, 570, 'completed', NOW() - INTERVAL '20 minutes'),
    ('Receiving', 'last6Hours', 600, 630, 'delayed', NOW() - INTERVAL '3 hours'),
    ('Receiving', 'last24Hours', 600, 720, 'delayed', NOW() - INTERVAL '10 hours'),
    ('Receiving', 'last7Days', 600, 600, 'completed', NOW() - INTERVAL '4 days');

-- Quality Check (4 time ranges)
INSERT INTO process_steps (name, time_range, average_duration, actual_duration, status, timestamp)
VALUES
    ('Quality Check', 'last1Hour', 600, 780, 'delayed', NOW() - INTERVAL '30 minutes'),
    ('Quality Check', 'last6Hours', 600, 570, 'completed', NOW() - INTERVAL '3 hours'),
    ('Quality Check', 'last24Hours', 600, 900, 'critical', NOW() - INTERVAL '12 hours'),
    ('Quality Check', 'last7Days', 600, 720, 'delayed', NOW() - INTERVAL '4 days');

-- Assembly (4 time ranges)
INSERT INTO process_steps (name, time_range, average_duration, actual_duration, status, timestamp)
VALUES
    ('Assembly', 'last1Hour', 1200, 1080, 'completed', NOW() - INTERVAL '45 minutes'),
    ('Assembly', 'last6Hours', 1200, 1800, 'critical', NOW() - INTERVAL '4 hours'),
    ('Assembly', 'last24Hours', 1200, 1140, 'completed', NOW() - INTERVAL '16 hours'),
    ('Assembly', 'last7Days', 1200, 1500, 'delayed', NOW() - INTERVAL '5 days');

-- Packaging (4 time ranges) - Shows bottleneck pattern
INSERT INTO process_steps (name, time_range, average_duration, actual_duration, status, timestamp)
VALUES
    ('Packaging', 'last1Hour', 360, 540, 'delayed', NOW() - INTERVAL '10 minutes'),
    ('Packaging', 'last6Hours', 360, 480, 'delayed', NOW() - INTERVAL '30 minutes'),
    ('Packaging', 'last24Hours', 360, 330, 'completed', NOW() - INTERVAL '4 hours'),
    ('Packaging', 'last7Days', 360, 390, 'completed', NOW() - INTERVAL '1 day');

-- Dispatch (4 time ranges) - Critical bottleneck
INSERT INTO process_steps (name, time_range, average_duration, actual_duration, status, timestamp)
VALUES
    ('Dispatch', 'last1Hour', 720, 1260, 'critical', NOW() - INTERVAL '5 minutes'),
    ('Dispatch', 'last6Hours', 720, 690, 'completed', NOW() - INTERVAL '45 minutes'),
    ('Dispatch', 'last24Hours', 720, 720, 'completed', NOW() - INTERVAL '2 hours'),
    ('Dispatch', 'last7Days', 720, 780, 'delayed', NOW() - INTERVAL '6 days');

-- STEP 3: Create Insights for High-Risk Processes
-- ============================================================================
INSERT INTO insights (process_name, time_range, severity, title, description, recommendation, risk_score, impact_score, timestamp)
SELECT 
    name as process_name,
    time_range,
    CASE 
        -- Critical severity
        WHEN actual_duration > average_duration * 1.5 THEN 'critical'
        -- High severity
        WHEN actual_duration > average_duration * 1.3 THEN 'high'
        -- Medium severity
        WHEN actual_duration > average_duration * 1.1 THEN 'medium'
        ELSE 'low'
    END as severity,
    CASE 
        WHEN name = 'Dispatch' AND time_range = 'last1Hour' THEN 'Critical Dispatch Bottleneck'
        WHEN name = 'Packaging' AND time_range = 'last1Hour' THEN 'High Priority Packaging Delay'
        WHEN name = 'Assembly' AND time_range = 'last6Hours' THEN 'Assembly Line Critical Delay'
        WHEN name = 'Quality Check' AND time_range = 'last24Hours' THEN 'Quality Check Bottleneck'
        ELSE name || ' Delay Detected'
    END as title,
    CASE 
        WHEN name = 'Dispatch' AND time_range = 'last1Hour' THEN 
            'Dispatch process showing 75% delay (' || actual_duration || 's vs ' || average_duration || 's expected). Critical bottleneck affecting downstream operations.'
        WHEN name = 'Packaging' AND time_range = 'last1Hour' THEN 
            'Packaging delayed by 50% (' || actual_duration || 's vs ' || average_duration || 's). Peak hour congestion detected.'
        WHEN name = 'Assembly' AND time_range = 'last6Hours' THEN 
            'Assembly line showing ' || ROUND(((actual_duration - average_duration) * 100.0 / average_duration)) || '% delay over past 6 hours.'
        WHEN name = 'Quality Check' AND time_range = 'last24Hours' THEN 
            'Quality inspection creating bottleneck. Process taking ' || actual_duration || 's vs ' || average_duration || 's baseline.'
        ELSE 'Process ' || name || ' delayed by ' || (actual_duration - average_duration) || 's in ' || time_range || ' window.'
    END as description,
    CASE name
        WHEN 'Dispatch' THEN 
            CASE time_range
                WHEN 'last1Hour' THEN 'URGENT: Add 2-3 workers immediately. Consider parallel processing stations. Review loading dock capacity.'
                WHEN 'last7Days' THEN 'Monitor dispatch capacity trends. Slight delays emerging - schedule review meeting.'
                ELSE 'Continue monitoring. Dispatch within acceptable range for this period.'
            END
        WHEN 'Packaging' THEN 
            CASE time_range
                WHEN 'last1Hour' THEN 'HIGH PRIORITY: Implement temporary staff during peak hours (2-5 PM). Set up parallel packaging line.'
                WHEN 'last6Hours' THEN 'Recommended: Distribute workload across multiple stations. Review packaging workflow.'
                ELSE 'Packaging stable. Continue current procedures.'
            END
        WHEN 'Quality Check' THEN 
            CASE time_range
                WHEN 'last24Hours' THEN 'CRITICAL: Implement sampling procedures (20% inspection) for low-risk items. Add inspection station.'
                WHEN 'last1Hour' THEN 'Alert: Quality check delays detected. Consider adding inspection resources.'
                ELSE 'Quality check performing adequately. No action needed.'
            END
        WHEN 'Assembly' THEN
            CASE time_range
                WHEN 'last6Hours' THEN 'URGENT: Review assembly process flow. Add resources or optimize workstations.'
                WHEN 'last7Days' THEN 'Warning: Pattern of delays detected. Schedule process optimization review.'
                ELSE 'Assembly meeting targets. Continue monitoring.'
            END
        WHEN 'Material Preparation' THEN
            CASE time_range
                WHEN 'last24Hours' THEN 'Action: Pre-stage materials to reduce retrieval time. Review warehouse layout.'
                ELSE 'Material preparation within normal parameters.'
            END
        WHEN 'Receiving' THEN
            CASE time_range
                WHEN 'last6Hours' THEN 'Monitor: Ensure dock capacity adequate. Minor delays detected.'
                WHEN 'last24Hours' THEN 'Action: Consider cross-docking for priority items. Review receiving schedule.'
                ELSE 'Receiving operations normal. Continue current procedures.'
            END
        ELSE 'Monitor process for trends. Current delay within acceptable parameters.'
    END as recommendation,
    CASE 
        -- Critical risk (>80)
        WHEN name = 'Dispatch' AND time_range = 'last1Hour' AND actual_duration > average_duration * 1.5 THEN 92
        WHEN name = 'Assembly' AND time_range = 'last6Hours' AND actual_duration > average_duration * 1.4 THEN 85
        WHEN name = 'Quality Check' AND time_range = 'last24Hours' AND actual_duration > average_duration * 1.4 THEN 88
        -- High risk (60-79)
        WHEN name = 'Packaging' AND actual_duration > average_duration * 1.3 THEN 75
        WHEN name = 'Quality Check' AND time_range = 'last1Hour' AND actual_duration > average_duration * 1.2 THEN 68
        WHEN name = 'Material Preparation' AND time_range = 'last24Hours' AND actual_duration > average_duration * 1.1 THEN 62
        -- Medium risk (40-59)
        WHEN actual_duration > average_duration * 1.1 THEN 55
        ELSE 35
    END as risk_score,
    CASE 
        -- High impact
        WHEN actual_duration > average_duration * 1.5 THEN 90
        WHEN actual_duration > average_duration * 1.3 THEN 75
        -- Medium impact
        WHEN actual_duration > average_duration * 1.1 THEN 60
        ELSE 40
    END as impact_score,
    timestamp
FROM process_steps
WHERE actual_duration > average_duration  -- Only create insights for delayed processes
ORDER BY 
    CASE 
        WHEN actual_duration > average_duration * 1.5 THEN 1
        WHEN actual_duration > average_duration * 1.3 THEN 2
        WHEN actual_duration > average_duration * 1.1 THEN 3
        ELSE 4
    END
LIMIT 12;

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify exactly 24 records (6 processes × 4 time ranges)
SELECT 
    'Total Records' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) = 24 THEN '✅ CORRECT' ELSE '❌ ERROR' END as status
FROM process_steps;

-- Verify each process has exactly 4 records (one per time range)
SELECT 
    name,
    COUNT(*) as records_per_process,
    CASE WHEN COUNT(*) = 4 THEN '✅' ELSE '❌' END as status
FROM process_steps
GROUP BY name
ORDER BY name;

-- Verify each time range has exactly 6 records (one per process)
SELECT 
    time_range,
    COUNT(*) as records_per_timerange,
    CASE WHEN COUNT(*) = 6 THEN '✅' ELSE '❌' END as status
FROM process_steps
GROUP BY time_range
ORDER BY 
    CASE time_range
        WHEN 'last1Hour' THEN 1
        WHEN 'last6Hours' THEN 2
        WHEN 'last24Hours' THEN 3
        WHEN 'last7Days' THEN 4
        ELSE 5
    END;

-- Show all 24 records in structured format
SELECT 
    name,
    time_range,
    average_duration as avg_sec,
    actual_duration as actual_sec,
    actual_duration - average_duration as delay_sec,
    ROUND(((actual_duration - average_duration)::NUMERIC / average_duration) * 100, 1) as delay_pct,
    status
FROM process_steps
ORDER BY 
    name,
    CASE time_range
        WHEN 'last1Hour' THEN 1
        WHEN 'last6Hours' THEN 2
        WHEN 'last24Hours' THEN 3
        WHEN 'last7Days' THEN 4
        ELSE 5
    END;

-- Test filtering by time range (should return 6 processes)
SELECT 
    '=== Testing: WHERE time_range = ''last1Hour'' ===' as test;
SELECT name, average_duration, actual_duration, status
FROM process_steps
WHERE time_range = 'last1Hour'
ORDER BY name;

-- Test filtering by process (should return 4 time ranges)
SELECT 
    '=== Testing: WHERE name = ''Packaging'' ===' as test;
SELECT time_range, average_duration, actual_duration, status
FROM process_steps
WHERE name = 'Packaging'
ORDER BY 
    CASE time_range
        WHEN 'last1Hour' THEN 1
        WHEN 'last6Hours' THEN 2
        WHEN 'last24Hours' THEN 3
        WHEN 'last7Days' THEN 4
    END;

-- Test combined filter (should return exactly 1 record)
SELECT 
    '=== Testing: WHERE name = ''Dispatch'' AND time_range = ''last1Hour'' ===' as test;
SELECT name, time_range, average_duration, actual_duration, status
FROM process_steps
WHERE name = 'Dispatch' AND time_range = 'last1Hour';

-- Count insights created by severity
SELECT 
    '=== Insights Breakdown ===' as summary;
SELECT 
    severity,
    COUNT(*) as count
FROM insights
GROUP BY severity
ORDER BY 
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ STRUCTURED DATA INSERTED SUCCESSFULLY!              ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Data Structure:';
    RAISE NOTICE '   ✅ 24 unique records (6 processes × 4 time ranges)';
    RAISE NOTICE '   ✅ Each process has exactly 4 time range variants';
    RAISE NOTICE '   ✅ Each time range has exactly 6 processes';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Processes (6):';
    RAISE NOTICE '   1. Material Preparation';
    RAISE NOTICE '   2. Receiving';
    RAISE NOTICE '   3. Quality Check';
    RAISE NOTICE '   4. Assembly';
    RAISE NOTICE '   5. Packaging';
    RAISE NOTICE '   6. Dispatch';
    RAISE NOTICE '';
    RAISE NOTICE '⏰ Time Ranges (4):';
    RAISE NOTICE '   1. last1Hour    (most recent)';
    RAISE NOTICE '   2. last6Hours   (recent history)';
    RAISE NOTICE '   3. last24Hours  (daily view)';
    RAISE NOTICE '   4. last7Days    (weekly view)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Insights: ~12 records for high-risk processes';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test Queries:';
    RAISE NOTICE '   SELECT * FROM process_steps WHERE time_range = ''last1Hour'';';
    RAISE NOTICE '   SELECT * FROM process_steps WHERE name = ''Packaging'';';
    RAISE NOTICE '   SELECT * FROM process_steps WHERE name = ''Dispatch'' AND time_range = ''last1Hour'';';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready for backend API queries!';
    RAISE NOTICE '';
END $$;
