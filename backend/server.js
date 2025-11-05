const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { supabase, testConnection } = require('./supabaseClient');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const processRoutes = require('./routes/processes');
const insightRoutes = require('./routes/insights');
const profileRoutes = require('./routes/profiles');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.path,
      method: req.method 
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Middleware
// CORS configuration - allow all origins in development, specific in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Process Intelligence Dashboard Backend API',
    status: 'Running',
    version: '1.0.0'
  });
});

// Mount routes
app.use('/api/auth', authLimiter, authRoutes); // Apply stricter rate limit to auth
app.use('/api/processes', processRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/notifications', notificationRoutes);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    supabase: supabase ? 'connected' : 'not configured'
  });
});

// Supabase connection test endpoint
app.get('/api/supabase/test', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      status: isConnected ? 'connected' : 'failed',
      message: isConnected 
        ? 'Supabase connection successful' 
        : 'Supabase connection failed - check credentials'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.logError(err, req);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  logger.info(`Supabase test: http://localhost:${PORT}/api/supabase/test`);
  
  // Test Supabase connection on startup (don't await to prevent blocking)
  logger.info('Testing Supabase connection...');
  testConnection().then(() => {
    logger.info('Server initialization complete');
  }).catch(err => {
    logger.error('Server started but Supabase test had issues', { error: err.message });
  });
});

module.exports = app;
