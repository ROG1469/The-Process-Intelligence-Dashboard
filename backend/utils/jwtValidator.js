/**
 * JWT Token Validation and Refresh Middleware
 * Handles token verification, refresh, and blacklisting
 */

const { supabase } = require('../supabaseClient');
const logger = require('./logger');

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

/**
 * Verify JWT token with Supabase
 */
async function verifyToken(token) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      logger.warn('Token verification failed', { error: error.message });
      return { valid: false, error: error.message };
    }
    
    if (!data.user) {
      return { valid: false, error: 'Invalid token' };
    }
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      logger.warn('Blacklisted token used', { userId: data.user.id });
      return { valid: false, error: 'Token has been revoked' };
    }
    
    return { valid: true, user: data.user };
  } catch (error) {
    logger.error('Token verification error', { error: error.message });
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Middleware to protect routes with JWT validation
 */
async function requireAuth(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header', { 
        path: req.path,
        ip: req.ip 
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization token'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const { valid, user, error } = await verifyToken(token);
    
    if (!valid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error || 'Invalid token'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    logger.info('User authenticated', { 
      userId: user.id, 
      email: user.email,
      path: req.path 
    });
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error', { 
      error: error.message,
      stack: error.stack 
    });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      logger.warn('Token refresh failed', { error: error.message });
      return { success: false, error: error.message };
    }
    
    if (!data.session) {
      return { success: false, error: 'Failed to refresh session' };
    }
    
    logger.info('Token refreshed successfully', { 
      userId: data.user?.id 
    });
    
    return {
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: data.user
    };
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    return { success: false, error: 'Token refresh failed' };
  }
}

/**
 * Add token to blacklist (for logout)
 */
function blacklistToken(token) {
  tokenBlacklist.add(token);
  logger.info('Token blacklisted', { tokenPrefix: token.substring(0, 20) });
  
  // Auto-remove after 24 hours (tokens expire anyway)
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Clear blacklist (admin function)
 */
function clearBlacklist() {
  const size = tokenBlacklist.size;
  tokenBlacklist.clear();
  logger.info('Token blacklist cleared', { tokensRemoved: size });
}

/**
 * Check if user has required role
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    const userRole = req.user.user_metadata?.role || 'viewer';
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Insufficient permissions', { 
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

module.exports = {
  verifyToken,
  requireAuth,
  refreshAccessToken,
  blacklistToken,
  clearBlacklist,
  requireRole
};
