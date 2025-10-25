-- ============================================================================
-- 000_create_tables.sql
-- Purpose: Create process_steps and insights tables from scratch
-- Run this FIRST if tables don't exist
-- ============================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS process_steps CASCADE;

-- ============================================================================
-- CREATE process_steps TABLE
-- ============================================================================

CREATE TABLE process_steps (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields
    name TEXT NOT NULL,
    time_range TEXT NOT NULL,
    
    -- Duration fields (in SECONDS)
    average_duration INTEGER NOT NULL,
    actual_duration INTEGER NOT NULL,
    
    -- Status field
    status TEXT NOT NULL CHECK (status IN ('completed', 'delayed', 'on-track', 'critical')),
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (
        time_range IN ('last1Hour', 'last6Hours', 'last24Hours', 'last7Days', 'older')
    ),
    CONSTRAINT unique_process_timerange UNIQUE (name, time_range)
);

-- ============================================================================
-- CREATE INDEXES for performance
-- ============================================================================

CREATE INDEX idx_process_steps_time_range ON process_steps(time_range);
CREATE INDEX idx_process_steps_name ON process_steps(name);
CREATE INDEX idx_process_steps_status ON process_steps(status);
CREATE INDEX idx_process_steps_timestamp ON process_steps(timestamp DESC);
CREATE INDEX idx_process_steps_time_range_timestamp ON process_steps(time_range, timestamp DESC);

-- ============================================================================
-- CREATE insights TABLE
-- ============================================================================

CREATE TABLE insights (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields
    process_name TEXT NOT NULL,
    time_range TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT,
    
    -- Metrics
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES for insights
-- ============================================================================

CREATE INDEX idx_insights_severity ON insights(severity);
CREATE INDEX idx_insights_process_name ON insights(process_name);
CREATE INDEX idx_insights_time_range ON insights(time_range);
CREATE INDEX idx_insights_timestamp ON insights(timestamp DESC);
CREATE INDEX idx_insights_risk_score ON insights(risk_score DESC);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Created:';
    RAISE NOTICE '   - process_steps table with 8 indexes';
    RAISE NOTICE '   - insights table with 5 indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next step:';
    RAISE NOTICE '   Run: 002_seed_data_with_timeframes.sql';
    RAISE NOTICE '';
END $$;
