-- ============================================================================
-- ROLLBACK: Remove Timeframe Column Migration
-- Purpose: Undo the timeframe column addition
-- Date: 2025-10-25
-- WARNING: This will remove the timeframe column and its data!
-- ============================================================================

-- Step 1: Drop indexes
-- ============================================================================
DROP INDEX IF EXISTS idx_process_steps_timeframe;
DROP INDEX IF EXISTS idx_process_steps_timeframe_timestamp;
DROP INDEX IF EXISTS idx_process_steps_status;

-- Step 2: Remove constraint
-- ============================================================================
ALTER TABLE process_steps
DROP CONSTRAINT IF EXISTS check_timeframe_values;

-- Step 3: Remove timeframe column
-- ============================================================================
ALTER TABLE process_steps
DROP COLUMN IF EXISTS timeframe;

-- Step 4: Verify rollback
-- ============================================================================
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'process_steps'
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Rollback completed successfully!';
    RAISE NOTICE '   - timeframe column removed';
    RAISE NOTICE '   - Indexes dropped';
    RAISE NOTICE '   - Constraints removed';
END $$;
