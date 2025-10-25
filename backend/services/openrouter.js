const axios = require('axios');

/**
 * OpenRouter AI Service
 * Provides AI-powered insights for warehouse process bottlenecks
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Generate AI-powered insight for a process bottleneck
 * @param {Object} processData - Process information
 * @param {string} processData.process_name - Name of the process
 * @param {number} processData.delay_percentage - Percentage of delay
 * @param {number} processData.risk_score - Risk score (0-100)
 * @param {string} processData.status - Process status
 * @param {number} processData.actual_duration - Actual duration in seconds
 * @param {number} processData.average_duration - Average duration in seconds
 * @param {string} messageType - Type of message (critical, urgent, warning, attention, info)
 * @returns {Promise<string>} AI-generated insight message
 */
async function generateAIInsight(processData, messageType) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  // Validate API key
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OpenRouter API key not configured');
  }

  const {
    process_name,
    delay_percentage,
    risk_score,
    status,
    actual_duration,
    average_duration
  } = processData;

  // Convert seconds to minutes for better readability
  const actualMinutes = Math.round(actual_duration / 60);
  const averageMinutes = Math.round(average_duration / 60);
  const delayMinutes = actualMinutes - averageMinutes;

  // Create context-aware prompt
  const prompt = `You are an AI warehouse operations analyst. Generate a concise, actionable insight message for this process bottleneck:

**Process:** ${process_name}
**Status:** ${status}
**Performance:** ${actualMinutes} minutes (expected: ${averageMinutes} minutes)
**Delay:** ${delayMinutes > 0 ? '+' : ''}${delayMinutes} minutes (${delay_percentage.toFixed(1)}%)
**Risk Score:** ${risk_score}/100
**Severity:** ${messageType}

Generate a single, specific insight message that:
1. Starts with an appropriate emoji (🔴 for critical, ⚠️ for urgent, 📊 for warning, 💡 for attention, ℹ️ for info)
2. Clearly explains what's happening and why it matters
3. Provides one specific, actionable recommendation
4. Is concise (1-2 sentences max)
5. Uses warehouse/operations terminology

Example format: "🔴 Dispatch is critically delayed (${delayMinutes}min over target). Add 2-3 workers to loading dock during 2-5pm peak hours to reduce congestion."

Generate ONLY the message, no additional text or explanation.`;

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/ROG1469/Warehouse-bottleneck-detector',
          'X-Title': 'Process Intelligence Hub'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const aiMessage = response.data.choices[0]?.message?.content?.trim();
    
    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    console.log(`✅ AI insight generated for ${process_name} using ${model}`);
    return aiMessage;

  } catch (error) {
    console.error(`❌ OpenRouter AI error for ${process_name}:`, error.message);
    throw error;
  }
}

/**
 * Generate rule-based fallback insight (used when AI fails)
 * @param {Object} processData - Process information
 * @param {string} messageType - Type of message
 * @returns {string} Rule-based insight message
 */
function generateFallbackInsight(processData, messageType) {
  const {
    process_name,
    delay_percentage,
    risk_score,
    actual_duration,
    average_duration
  } = processData;

  const delayMinutes = Math.round((actual_duration - average_duration) / 60);
  const emoji = getMessageEmoji(messageType);
  
  // Generate message based on severity
  if (messageType === 'critical') {
    return `${emoji} CRITICAL: ${process_name} severely delayed by ${delayMinutes} minutes (${Math.abs(delay_percentage).toFixed(1)}%). Immediate intervention required — deploy additional resources and investigate root cause.`;
  } else if (messageType === 'urgent') {
    return `${emoji} URGENT: ${process_name} experiencing ${delayMinutes} minute delay (risk score: ${risk_score}). Recommend immediate resource reallocation and process review.`;
  } else if (messageType === 'warning') {
    return `${emoji} WARNING: ${process_name} showing ${Math.abs(delay_percentage).toFixed(1)}% delay. Monitor closely and prepare contingency plans to prevent escalation.`;
  } else if (messageType === 'attention') {
    return `${emoji} ATTENTION: ${process_name} has early warning signs (risk: ${risk_score}). Continue monitoring and consider process optimization.`;
  } else {
    return `${emoji} ${process_name} showing ${Math.abs(delay_percentage).toFixed(1)}% delay. Review for potential optimization opportunities.`;
  }
}

/**
 * Get appropriate emoji for message type
 * @param {string} messageType - Message type
 * @returns {string} Emoji
 */
function getMessageEmoji(messageType) {
  switch (messageType) {
    case 'critical': return '🔴';
    case 'urgent': return '⚠️';
    case 'warning': return '📊';
    case 'attention': return '💡';
    default: return 'ℹ️';
  }
}

/**
 * Check if OpenRouter is configured and available
 * @returns {boolean} True if configured
 */
function isConfigured() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return apiKey && apiKey !== 'your_openrouter_api_key_here';
}

module.exports = {
  generateAIInsight,
  generateFallbackInsight,
  isConfigured
};
