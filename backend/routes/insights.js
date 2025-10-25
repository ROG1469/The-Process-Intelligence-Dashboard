const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { generateAIInsight, generateFallbackInsight, isConfigured } = require('../services/openrouter');

/**
 * Helper function to calculate time range
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
      return null;
  }
}

/**
 * Helper function to generate human-readable insight message
 */
function generateInsightMessage(process, analysisType = 'info') {
  const processName = process.process_name || process.processName || process.name;
  const delayPercent = Math.round(Math.abs(process.delay_percentage || process.delayPercentage || 0));
  const riskScore = Math.round(process.risk_score || process.riskScore || 0);
  
  // Different message templates based on severity
  const templates = {
    critical: `🔴 ${processName} running ${delayPercent}% behind — CRITICAL bottleneck detected (Risk: ${riskScore}/100)`,
    urgent: `� ${processName} experiencing ${delayPercent}% delay — immediate attention required (Risk: ${riskScore}/100)`,
    warning: `⚠️ ${processName} delayed by ${delayPercent}% — resource constraint detected (Risk: ${riskScore}/100)`,
    attention: `📊 ${processName} showing ${delayPercent}% variance — monitor closely (Risk: ${riskScore}/100)`,
    info: `ℹ️ ${processName} operating normally — no issues detected`
  };
  
  return templates[analysisType] || templates.info;
}

/**
 * GET /api/insights
 * Generate AI insight messages from ML analysis
 * 
 * This endpoint:
 * 1. Uses results from /api/analyze (ML endpoint)
 * 2. Generates human-readable text messages for high-risk processes
 * 3. Returns array of text messages
 * 
 * Query Parameters:
 *   - range: last1Hour, last6Hours, last24Hours, last7Days (default: last1Hour)
 *   - threshold: Risk threshold 0-100 (default: 20)
 */
router.get('/', async (req, res) => {
  try {
    const { range = 'last1Hour', threshold = 20 } = req.query;
    const thresholdValue = parseInt(threshold);

    console.log(`📊 Generating AI-powered insights (range: ${range}, threshold: ${thresholdValue})`);

    // Step 1: Fetch processes from database filtered by time_range
    const { data: processes, error: processError } = await supabase
      .from('process_steps')
      .select('*')
      .eq('time_range', range)
      .order('actual_duration', { ascending: false });

    if (processError) {
      console.error('Error fetching processes:', processError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch process data',
        message: processError.message,
        messages: []
      });
    }

    // If no data, return empty messages
    if (!processes || processes.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        range,
        threshold: thresholdValue,
        messages: ['ℹ️ No process data available for the selected time range']
      });
    }

    // Step 2: Calculate metrics for each process
    const insights = [];
    
    processes.forEach(process => {
      // Calculate delay percentage
      const delayPercentage = process.average_duration > 0
        ? ((process.actual_duration - process.average_duration) / process.average_duration) * 100
        : 0;

      // Calculate risk score with proper weighting
      const delayTime = process.actual_duration - process.average_duration;
      let riskScore = 0;
      
      // Delay percentage is primary factor (0-50 points)
      const absDelayPercent = Math.abs(delayPercentage);
      if (absDelayPercent >= 50) riskScore += 50;
      else if (absDelayPercent >= 30) riskScore += 40;
      else if (absDelayPercent >= 20) riskScore += 30;
      else if (absDelayPercent >= 10) riskScore += 20;
      else riskScore += absDelayPercent; // 0-10 points
      
      // Status is critical factor (0-40 points)
      if (process.status === 'critical') riskScore += 40;
      else if (process.status === 'failed') riskScore += 35;
      else if (process.status === 'delayed') riskScore += 20;
      else if (process.status === 'in-progress') riskScore += 10;
      // completed gets 0
      
      // Duration delay impact (0-10 points)
      const delayMinutes = delayTime / 60;
      if (delayMinutes >= 60) riskScore += 10; // 1+ hour delay
      else if (delayMinutes >= 30) riskScore += 7;
      else if (delayMinutes >= 15) riskScore += 5;
      else if (delayMinutes > 0) riskScore += 3;
      
      riskScore = Math.min(Math.round(riskScore), 100);

      // Only include processes that meet threshold
      if (riskScore >= thresholdValue || delayPercentage >= 20) {
        const processData = {
          process_name: process.name,
          delay_percentage: delayPercentage,
          risk_score: riskScore,
          status: process.status,
          actual_duration: process.actual_duration,
          average_duration: process.average_duration
        };

        // Determine message type and priority based on status AND risk
        let messageType = 'info';
        if (process.status === 'critical' || riskScore >= 80) {
          messageType = 'critical';
        } else if (process.status === 'failed' || riskScore >= 70) {
          messageType = 'urgent';
        } else if (process.status === 'delayed' || riskScore >= 60) {
          messageType = 'warning';
        } else if (riskScore >= 40) {
          messageType = 'attention';
        }

        const message = generateInsightMessage(processData, messageType);
        insights.push({
          message,
          processName: process.name,
          delayPercentage: Math.round(delayPercentage),
          riskScore: Math.round(riskScore),
          type: messageType
        });
      }
    });

    // Step 3: Generate AI insights for Critical/High risk processes
    // Use OpenRouter AI for high-value insights, fallback to rules for others
    const aiConfigured = isConfigured();
    console.log(`🤖 AI Service: ${aiConfigured ? 'Enabled' : 'Disabled (using rule-based fallback)'}`);

    const insightPromises = insights.map(async (insight) => {
      const { processName, delayPercentage, riskScore, type } = insight;
      
      // Find the full process data
      const process = processes.find(p => p.name === processName);
      if (!process) return insight;

      const processData = {
        process_name: processName,
        delay_percentage: delayPercentage,
        risk_score: riskScore,
        status: process.status,
        actual_duration: process.actual_duration,
        average_duration: process.average_duration
      };

      // Use AI for Critical and High risk processes (risk score >= 60)
      if (aiConfigured && riskScore >= 60) {
        try {
          const aiMessage = await generateAIInsight(processData, type);
          return { ...insight, message: aiMessage, aiGenerated: true };
        } catch (error) {
          console.warn(`⚠️  AI generation failed for ${processName}, using fallback:`, error.message);
          const fallbackMessage = generateFallbackInsight(processData, type);
          return { ...insight, message: fallbackMessage, aiGenerated: false };
        }
      } else {
        // Use rule-based for lower risk or when AI not configured
        const fallbackMessage = generateFallbackInsight(processData, type);
        return { ...insight, message: fallbackMessage, aiGenerated: false };
      }
    });

    // Wait for all insights to be generated
    const generatedInsights = await Promise.all(insightPromises);

    // Sort by risk score (highest first)
    generatedInsights.sort((a, b) => b.riskScore - a.riskScore);

    // Extract just the messages for simple display
    const messages = generatedInsights.map(i => i.message);

    // Add summary message if we have insights
    if (generatedInsights.length === 0) {
      messages.push('✅ All processes operating normally — no bottlenecks detected');
    }

    const aiCount = generatedInsights.filter(i => i.aiGenerated).length;
    console.log(`✅ Generated ${generatedInsights.length} insights (${aiCount} AI-powered, ${generatedInsights.length - aiCount} rule-based)`);

    res.status(200).json({
      success: true,
      count: generatedInsights.length,
      range,
      threshold: thresholdValue,
      messages,
      details: generatedInsights // Full details for debugging/advanced UI
    });

  } catch (err) {
    console.error('Unexpected error generating insights:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
      messages: ['❌ Failed to generate insights — please try again']
    });
  }
});

/**
 * GET /api/insights/high-risk
 * Get high-risk insights (risk score >= 70)
 */
router.get('/high-risk', async (req, res) => {
  try {
    const { range } = req.query;

    let query = supabase
      .from('insights')
      .select(`
        *,
        process_steps (
          id,
          name,
          status,
          actual_duration,
          average_duration
        )
      `)
      .gte('risk_score', 70)
      .order('risk_score', { ascending: false });

    // Apply time range filter
    if (range) {
      const startTime = getTimeRangeStart(range);
      if (startTime) {
        query = query.gte('timestamp', startTime.toISOString());
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching high-risk insights:', error);
      return res.status(500).json({
        error: 'Failed to fetch high-risk insights',
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      count: data.length,
      range: range || 'all',
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
 * GET /api/insights/:id
 * Get a specific insight by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('insights')
      .select(`
        *,
        process_steps (
          id,
          name,
          status,
          actual_duration,
          average_duration,
          timestamp
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Insight not found'
        });
      }
      
      console.error('Error fetching insight:', error);
      return res.status(500).json({
        error: 'Failed to fetch insight',
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
 * POST /api/insights
 * Create a new insight
 * 
 * Body:
 *   - process_id: UUID (optional)
 *   - risk_score: integer (required, 0-100)
 *   - recommendation: string (required)
 */
router.post('/', async (req, res) => {
  try {
    const { process_id, risk_score, recommendation } = req.body;

    // Validate required fields
    if (risk_score === undefined || !recommendation) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'risk_score and recommendation are required'
      });
    }

    // Validate risk score range
    if (risk_score < 0 || risk_score > 100) {
      return res.status(400).json({
        error: 'Invalid risk score',
        message: 'risk_score must be between 0 and 100'
      });
    }

    // Insert new insight
    const { data, error } = await supabase
      .from('insights')
      .insert([
        {
          process_id: process_id || null,
          risk_score,
          recommendation,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating insight:', error);
      return res.status(500).json({
        error: 'Failed to create insight',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Insight created successfully',
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
