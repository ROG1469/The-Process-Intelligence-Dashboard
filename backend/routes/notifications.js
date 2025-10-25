const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../utils/jwtValidator');
const { sendBottleneckAlert, sendDailySummary } = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * POST /api/notifications/test
 * Send test email (admin only)
 */
router.post('/test', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { email } = req.body;
    const testEmail = email || req.user.email;

    const testBottleneck = {
      processName: 'Test Process',
      status: 'critical',
      riskLevel: 'Critical',
      delay: 15,
      riskScore: 95,
      aiRecommendation: 'This is a test notification. No action required.'
    };

    const result = await sendBottleneckAlert(testEmail, testBottleneck);

    if (result.success) {
      logger.info('Test email sent', { to: testEmail });
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        message: result.error
      });
    }
  } catch (err) {
    logger.error('Test email error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send test email'
    });
  }
});

/**
 * POST /api/notifications/alert
 * Send critical bottleneck alert
 */
router.post('/alert', requireAuth, async (req, res) => {
  try {
    const { bottleneck, recipients } = req.body;

    if (!bottleneck) {
      return res.status(400).json({
        error: 'Missing bottleneck data',
        message: 'Bottleneck information is required'
      });
    }

    const emailList = recipients || [req.user.email];
    const results = [];

    for (const email of emailList) {
      const result = await sendBottleneckAlert(email, bottleneck);
      results.push({ email, ...result });
    }

    const successCount = results.filter(r => r.success).length;

    logger.info('Bottleneck alerts sent', { 
      total: results.length,
      successful: successCount 
    });

    res.status(200).json({
      success: true,
      message: `Sent ${successCount} of ${results.length} alerts`,
      results
    });
  } catch (err) {
    logger.error('Alert sending error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send alerts'
    });
  }
});

/**
 * POST /api/notifications/summary
 * Send daily summary report
 */
router.post('/summary', requireAuth, async (req, res) => {
  try {
    const { summary, recipients } = req.body;

    if (!summary) {
      return res.status(400).json({
        error: 'Missing summary data',
        message: 'Summary information is required'
      });
    }

    const emailList = recipients || [req.user.email];
    const results = [];

    for (const email of emailList) {
      const result = await sendDailySummary(email, summary);
      results.push({ email, ...result });
    }

    const successCount = results.filter(r => r.success).length;

    logger.info('Summary emails sent', { 
      total: results.length,
      successful: successCount 
    });

    res.status(200).json({
      success: true,
      message: `Sent ${successCount} of ${results.length} summaries`,
      results
    });
  } catch (err) {
    logger.error('Summary sending error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send summaries'
    });
  }
});

module.exports = router;
