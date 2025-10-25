/**
 * Email Notification Service
 * Sends alerts for critical bottlenecks and system events
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    logger.warn('Email service not configured - SMTP credentials missing');
    return null;
  }

  try {
    transporter = nodemailer.createTransporter(EMAIL_CONFIG);
    logger.info('Email service initialized');
    return transporter;
  } catch (error) {
    logger.error('Failed to initialize email service', { error: error.message });
    return null;
  }
}

/**
 * Send email notification
 */
async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    transporter = initializeTransporter();
    if (!transporter) {
      logger.warn('Email not sent - service not configured');
      return { success: false, error: 'Email service not configured' };
    }
  }

  try {
    const mailOptions = {
      from: `"Process Intelligence Hub" <${EMAIL_CONFIG.auth.user}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', { 
      to, 
      subject, 
      messageId: info.messageId 
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', { 
      to, 
      subject, 
      error: error.message 
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send critical bottleneck alert
 */
async function sendBottleneckAlert(userEmail, bottleneck) {
  const subject = `🚨 Critical Bottleneck Alert: ${bottleneck.processName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fff3cd; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 4px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #dc3545; }
        .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Critical Bottleneck Detected</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2 style="margin-top: 0; color: #dc3545;">⚠️ Immediate Attention Required</h2>
            <p><strong>Process:</strong> ${bottleneck.processName}</p>
            <p><strong>Status:</strong> ${bottleneck.status}</p>
            <p><strong>Risk Level:</strong> ${bottleneck.riskLevel}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${bottleneck.delay || 0} min</div>
              <div class="stat-label">Delay</div>
            </div>
            <div class="stat">
              <div class="stat-value">${bottleneck.riskScore || 0}</div>
              <div class="stat-label">Risk Score</div>
            </div>
          </div>

          <h3>AI Recommendation:</h3>
          <p>${bottleneck.aiRecommendation || 'Investigating root cause...'}</p>

          <p style="margin-top: 30px;">
            <strong>Action Required:</strong> Please review this bottleneck immediately in the dashboard to prevent further delays.
          </p>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
            View Dashboard
          </a>

          <div class="footer">
            <p>This is an automated alert from Process Intelligence Hub</p>
            <p>To manage notification preferences, visit your profile settings</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    CRITICAL BOTTLENECK ALERT
    
    Process: ${bottleneck.processName}
    Status: ${bottleneck.status}
    Risk Level: ${bottleneck.riskLevel}
    Delay: ${bottleneck.delay || 0} minutes
    Risk Score: ${bottleneck.riskScore || 0}
    
    AI Recommendation: ${bottleneck.aiRecommendation || 'Investigating root cause...'}
    
    Please review this bottleneck immediately in the dashboard.
    Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard
  `;

  return await sendEmail({ to: userEmail, subject, html, text });
}

/**
 * Send daily summary report
 */
async function sendDailySummary(userEmail, summary) {
  const subject = `📊 Daily Process Summary - ${new Date().toLocaleDateString()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .critical { color: #dc3545; }
        .warning { color: #ffc107; }
        .success { color: #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Daily Process Summary</h1>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-value critical">${summary.critical || 0}</div>
              <div>Critical</div>
            </div>
            <div class="summary-card">
              <div class="summary-value warning">${summary.delayed || 0}</div>
              <div>Delayed</div>
            </div>
            <div class="summary-card">
              <div class="summary-value success">${summary.completed || 0}</div>
              <div>Completed</div>
            </div>
          </div>

          <h3>Key Insights:</h3>
          <ul>
            ${(summary.insights || []).map(insight => `<li>${insight}</li>`).join('')}
          </ul>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
            View Full Dashboard
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    DAILY PROCESS SUMMARY - ${new Date().toLocaleDateString()}
    
    Critical: ${summary.critical || 0}
    Delayed: ${summary.delayed || 0}
    Completed: ${summary.completed || 0}
    
    Key Insights:
    ${(summary.insights || []).map((insight, i) => `${i + 1}. ${insight}`).join('\n')}
  `;

  return await sendEmail({ to: userEmail, subject, html, text });
}

/**
 * Send welcome email to new users
 */
async function sendWelcomeEmail(userEmail, userName) {
  const subject = '👋 Welcome to Process Intelligence Hub';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Welcome to Process Intelligence Hub!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Welcome aboard! Your account has been successfully created.</p>
          <p>You can now access real-time process monitoring, AI-powered bottleneck detection, and actionable insights to optimize your warehouse operations.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
            Get Started
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Welcome to Process Intelligence Hub, ${userName}!`;

  return await sendEmail({ to: userEmail, subject, html, text });
}

module.exports = {
  sendEmail,
  sendBottleneckAlert,
  sendDailySummary,
  sendWelcomeEmail,
  initializeTransporter
};
