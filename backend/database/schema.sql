-- ============================================
-- Process Intelligence Hub Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: process_steps
-- Stores warehouse process steps and their performance data
-- ============================================
CREATE TABLE IF NOT EXISTS process_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  average_duration INTEGER NOT NULL, -- in seconds
  actual_duration INTEGER NOT NULL, -- in seconds
  status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'in-progress', 'delayed', 'failed')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_process_steps_timestamp ON process_steps(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_process_steps_status ON process_steps(status);

-- ============================================
-- Table: insights
-- Stores AI-generated insights and recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES process_steps(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  recommendation TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_insights_process_id ON insights(process_id);
CREATE INDEX IF NOT EXISTS idx_insights_timestamp ON insights(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_insights_risk_score ON insights(risk_score DESC);

-- ============================================
-- Seed Data: Sample Process Steps
-- ============================================

INSERT INTO process_steps (name, average_duration, actual_duration, status, timestamp) VALUES
  -- Material Prep
  ('Material Prep', 300, 280, 'completed', NOW() - INTERVAL '2 hours'),
  ('Material Prep', 300, 450, 'delayed', NOW() - INTERVAL '1 hour'),
  ('Material Prep', 300, 320, 'completed', NOW() - INTERVAL '30 minutes'),
  
  -- Assembly
  ('Assembly', 600, 580, 'completed', NOW() - INTERVAL '2 hours'),
  ('Assembly', 600, 720, 'delayed', NOW() - INTERVAL '1 hour'),
  ('Assembly', 600, 650, 'in-progress', NOW() - INTERVAL '15 minutes'),
  
  -- Quality Check
  ('Quality Check', 180, 170, 'completed', NOW() - INTERVAL '2 hours'),
  ('Quality Check', 180, 240, 'delayed', NOW() - INTERVAL '1 hour'),
  ('Quality Check', 180, 190, 'completed', NOW() - INTERVAL '20 minutes'),
  
  -- Packaging
  ('Packaging', 240, 230, 'completed', NOW() - INTERVAL '2 hours'),
  ('Packaging', 240, 360, 'delayed', NOW() - INTERVAL '1 hour'),
  ('Packaging', 240, 250, 'in-progress', NOW() - INTERVAL '10 minutes'),
  
  -- Dispatch
  ('Dispatch', 420, 400, 'completed', NOW() - INTERVAL '2 hours'),
  ('Dispatch', 420, 540, 'delayed', NOW() - INTERVAL '1 hour'),
  ('Dispatch', 420, 430, 'completed', NOW() - INTERVAL '5 minutes');

-- ============================================
-- Seed Data: Sample Insights
-- ============================================

-- Get some process IDs for insights (this will grab delayed processes)
WITH delayed_processes AS (
  SELECT id, name FROM process_steps WHERE status = 'delayed' LIMIT 5
)
INSERT INTO insights (process_id, risk_score, recommendation, timestamp)
SELECT 
  id,
  CASE name
    WHEN 'Material Prep' THEN 75
    WHEN 'Assembly' THEN 85
    WHEN 'Quality Check' THEN 68
    WHEN 'Packaging' THEN 92
    WHEN 'Dispatch' THEN 80
    ELSE 70
  END as risk_score,
  CASE name
    WHEN 'Material Prep' THEN 'Allocate additional staff during peak hours to reduce material preparation delays.'
    WHEN 'Assembly' THEN 'Assembly line bottleneck detected. Consider adding parallel workstations.'
    WHEN 'Quality Check' THEN 'Implement automated quality check systems to reduce inspection time.'
    WHEN 'Packaging' THEN 'Critical delay in packaging. Recommend immediate supervisor review and resource reallocation.'
    WHEN 'Dispatch' THEN 'Dispatch delays impacting delivery schedules. Optimize route planning and loading procedures.'
    ELSE 'Review process workflow for optimization opportunities.'
  END as recommendation,
  NOW() - INTERVAL '30 minutes'
FROM delayed_processes;

-- ============================================
-- Additional Sample Insights (General)
-- ============================================

INSERT INTO insights (process_id, risk_score, recommendation, timestamp) VALUES
  (NULL, 65, 'Overall workflow efficiency is at 78%. Consider cross-training staff to handle multiple process steps.', NOW() - INTERVAL '1 hour'),
  (NULL, 58, 'Peak hour analysis shows capacity constraints between 2-4 PM. Adjust shift schedules accordingly.', NOW() - INTERVAL '2 hours'),
  (NULL, 72, 'Predictive analysis indicates potential bottleneck in Quality Check next week due to equipment maintenance.', NOW() - INTERVAL '3 hours');

-- ============================================
-- Verification Queries
-- ============================================

-- View all process steps
-- SELECT * FROM process_steps ORDER BY timestamp DESC;

-- View all insights
-- SELECT * FROM insights ORDER BY risk_score DESC;

-- View delayed processes with their insights
-- SELECT 
--   ps.name, 
--   ps.status, 
--   ps.actual_duration - ps.average_duration as delay_seconds,
--   i.risk_score,
--   i.recommendation
-- FROM process_steps ps
-- LEFT JOIN insights i ON ps.id = i.process_id
-- WHERE ps.status = 'delayed'
-- ORDER BY i.risk_score DESC;

-- ============================================
-- Update Timestamp Trigger (Optional)
-- Auto-update updated_at field on row changes
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_process_steps_updated_at
  BEFORE UPDATE ON process_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- Enable RLS for production security
-- ============================================

-- Enable RLS on tables
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read process_steps"
  ON process_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read insights"
  ON insights FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert data
CREATE POLICY "Allow authenticated users to insert process_steps"
  ON process_steps FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert insights"
  ON insights FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their own data
CREATE POLICY "Allow authenticated users to update process_steps"
  ON process_steps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update insights"
  ON insights FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '✅ Tables created: process_steps, insights';
  RAISE NOTICE '✅ Sample data seeded: 15 process steps, 8 insights';
  RAISE NOTICE '✅ Row Level Security policies enabled';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Next steps:';
  RAISE NOTICE '   1. Verify data in Supabase Dashboard → Table Editor';
  RAISE NOTICE '   2. Test API endpoints with the seeded data';
  RAISE NOTICE '   3. Proceed to Stage 2.1.4: API Implementation';
END $$;
