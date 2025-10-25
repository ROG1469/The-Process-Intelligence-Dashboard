const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

/**
 * Helper function to calculate time range
 * @param {string} range - Time range identifier
 * @returns {Date} Start date for the time range
 */
function getTimeRangeStart(range) {
  const now = new Date();
  
  switch(range) {
    case 'last1Hour':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case 'last6Hours':
      return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case 'last24Hours':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'last7Days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default:
      return null; // No filter, return all
  }
}

/**
 * GET /api/processes
 * Fetch all process steps with optional time range filtering
 * 
 * Query Parameters:
 *   - range: last1Hour, last6Hours, last24Hours, last7Days
 *   - status: completed, in-progress, delayed, failed
 *   - name: Filter by process name
 * 
 * Example: GET /api/processes?range=last24Hours&status=delayed
 */
router.get('/', async (req, res) => {
  try {
    const { range, status, name } = req.query;

    // Start building the query
    let query = supabase
      .from('process_steps')
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply time range filter using time_range column (not timestamp!)
    if (range) {
      query = query.eq('time_range', range);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply name filter
    if (name) {
      query = query.eq('name', name);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching processes:', error);
      return res.status(500).json({
        error: 'Failed to fetch processes',
        message: error.message
      });
    }

    // Calculate some statistics
    const stats = {
      total: data.length,
      completed: data.filter(p => p.status === 'completed').length,
      delayed: data.filter(p => p.status === 'delayed').length,
      critical: data.filter(p => p.status === 'critical').length,
      inProgress: data.filter(p => p.status === 'in-progress').length,
      failed: data.filter(p => p.status === 'failed').length
    };

    res.status(200).json({
      success: true,
      count: data.length,
      stats: stats,
      filters: {
        range: range || 'all',
        status: status || 'all',
        name: name || 'all'
      },
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

/**
 * GET /api/processes/delayed
 * Get only delayed processes (bottlenecks)
 * 
 * Query Parameters:
 *   - range: last1Hour, last6Hours, last24Hours, last7Days
 */
router.get('/delayed', async (req, res) => {
  try {
    const { range } = req.query;

    let query = supabase
      .from('process_steps')
      .select('*')
      .eq('status', 'delayed')
      .order('timestamp', { ascending: false });

    // Apply time range filter using time_range column
    if (range) {
      query = query.eq('time_range', range);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching delayed processes:', error);
      return res.status(500).json({
        error: 'Failed to fetch delayed processes',
        message: error.message
      });
    }

    // Calculate delay statistics
    const processesWithDelay = data.map(process => ({
      ...process,
      delay_seconds: process.actual_duration - process.average_duration,
      delay_percentage: Math.round(
        ((process.actual_duration - process.average_duration) / process.average_duration) * 100
      )
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      range: range || 'all',
      data: processesWithDelay
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

/**
 * GET /api/processes/summary
 * Get summary statistics by process name
 * 
 * Query Parameters:
 *   - range: last1Hour, last6Hours, last24Hours, last7Days
 */
router.get('/summary', async (req, res) => {
  try {
    const { range } = req.query;

    let query = supabase
      .from('process_steps')
      .select('*');

    // Apply time range filter using time_range column
    if (range) {
      query = query.eq('time_range', range);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching process summary:', error);
      return res.status(500).json({
        error: 'Failed to fetch process summary',
        message: error.message
      });
    }

    // Group by process name and calculate statistics
    const summary = {};
    
    data.forEach(process => {
      if (!summary[process.name]) {
        summary[process.name] = {
          name: process.name,
          total_runs: 0,
          completed: 0,
          delayed: 0,
          in_progress: 0,
          failed: 0,
          avg_duration: 0,
          max_duration: 0,
          min_duration: Infinity,
          total_delay: 0
        };
      }

      const stats = summary[process.name];
      stats.total_runs++;
      stats[process.status.replace('-', '_')]++;
      stats.avg_duration += process.actual_duration;
      stats.max_duration = Math.max(stats.max_duration, process.actual_duration);
      stats.min_duration = Math.min(stats.min_duration, process.actual_duration);
      
      if (process.actual_duration > process.average_duration) {
        stats.total_delay += (process.actual_duration - process.average_duration);
      }
    });

    // Calculate averages
    Object.values(summary).forEach(stats => {
      stats.avg_duration = Math.round(stats.avg_duration / stats.total_runs);
      stats.min_duration = stats.min_duration === Infinity ? 0 : stats.min_duration;
    });

    res.status(200).json({
      success: true,
      range: range || 'all',
      total_processes: Object.keys(summary).length,
      data: Object.values(summary)
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

/**
 * GET /api/processes/:id
 * Get a specific process by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('process_steps')
      .select(`
        *,
        insights (
          id,
          risk_score,
          recommendation,
          timestamp
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Process not found'
        });
      }
      
      console.error('Error fetching process:', error);
      return res.status(500).json({
        error: 'Failed to fetch process',
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

/**
 * POST /api/processes
 * Create a new process step
 * 
 * Body:
 *   - name: string (required)
 *   - average_duration: integer (required)
 *   - actual_duration: integer (required)
 *   - status: string (required)
 */
router.post('/', async (req, res) => {
  try {
    const { name, average_duration, actual_duration, status } = req.body;

    // Validate required fields
    if (!name || !average_duration || !actual_duration || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, average_duration, actual_duration, and status are required'
      });
    }

    // Validate status
    const validStatuses = ['completed', 'in-progress', 'delayed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Insert new process
    const { data, error } = await supabase
      .from('process_steps')
      .insert([
        {
          name,
          average_duration,
          actual_duration,
          status,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating process:', error);
      return res.status(500).json({
        error: 'Failed to create process',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Process created successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

module.exports = router;
