-- ============================================================================
-- MIGRATION: Add Timeframe Column to process_steps
-- Purpose: Enable time-range filtering for processes
-- Date: 2025-10-25
-- ============================================================================

-- Step 1: Add timeframe column to process_steps table
-- ============================================================================
ALTER TABLE process_steps 
ADD COLUMN IF NOT EXISTS timeframe TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN process_steps.timeframe IS 
'Time range category for filtering: last1Hour, last6Hours, last24Hours, last7Days';

-- Step 2: Ensure id column is properly set as primary key (if not already)
-- ============================================================================
-- Check if id exists and is UUID type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'process_steps' 
        AND column_name = 'id'
    ) THEN
        -- Add id column if it doesn't exist
        ALTER TABLE process_steps 
        ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    ELSE
        -- Ensure it's a primary key
        ALTER TABLE process_steps 
        ADD PRIMARY KEY (id) IF NOT EXISTS;
    END IF;
END $$;

-- Step 3: Create index on timeframe for better query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_process_steps_timeframe 
ON process_steps(timeframe);

-- Create composite index for common queries (timeframe + timestamp)
CREATE INDEX IF NOT EXISTS idx_process_steps_timeframe_timestamp 
ON process_steps(timeframe, timestamp DESC);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_process_steps_status 
ON process_steps(status);

-- Step 4: Update existing records with appropriate timeframe values
-- ============================================================================
-- This assigns timeframes based on the timestamp age
UPDATE process_steps
SET timeframe = CASE
    -- Records from last hour
    WHEN timestamp >= NOW() - INTERVAL '1 hour' THEN 'last1Hour'
    -- Records from last 6 hours
    WHEN timestamp >= NOW() - INTERVAL '6 hours' THEN 'last6Hours'
    -- Records from last 24 hours
    WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN 'last24Hours'
    -- Records from last 7 days
    WHEN timestamp >= NOW() - INTERVAL '7 days' THEN 'last7Days'
    -- Older records
    ELSE 'older'
END
WHERE timeframe IS NULL;

-- Step 5: Create validation constraint
-- ============================================================================
-- Ensure only valid timeframe values can be inserted
ALTER TABLE process_steps
ADD CONSTRAINT check_timeframe_values 
CHECK (timeframe IN ('last1Hour', 'last6Hours', 'last24Hours', 'last7Days', 'older', NULL));

-- Step 6: Verify the migration
-- ============================================================================
-- Check if columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'process_steps'
ORDER BY ordinal_position;

-- Count records by timeframe
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
        WHEN 'older' THEN 5
        ELSE 6
    END;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - timeframe column added';
    RAISE NOTICE '   - Indexes created for performance';
    RAISE NOTICE '   - Existing records updated';
    RAISE NOTICE '   - Validation constraints applied';
END $$;
