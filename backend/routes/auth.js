const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { requireAuth, refreshAccessToken, blacklistToken } = require('../utils/jwtValidator');
const logger = require('../utils/logger');

/**
 * POST /api/auth/signup
 * Create a new user account
 * Body: { email, password, name }
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, and name are required'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      // Handle duplicate email error
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'An account with this email already exists'
        });
      }
      
      return res.status(400).json({
        error: 'Signup failed',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name
      },
      session: data.session
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during signup'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Handle invalid credentials
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      return res.status(400).json({
        error: 'Login failed',
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during login'
    });
  }
});

/**
 * POST /api/auth/logout
 * End user session
 * Headers: Authorization: Bearer <access_token>
 */
router.post('/logout', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No access token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Blacklist the token
    blacklistToken(token);

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.warn('Supabase logout error', { error: error.message });
      // Continue anyway since token is blacklisted
    }

    logger.info('User logged out successfully');
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (err) {
    logger.error('Logout error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during logout'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Body: { refresh_token }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }

    const result = await refreshAccessToken(refresh_token);

    if (!result.success) {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in
    });

  } catch (err) {
    logger.error('Token refresh error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during token refresh'
    });
  }
});

/**
 * GET /api/auth/user
 * Get current user information
 * Headers: Authorization: Bearer <access_token>
 */
router.get('/user', requireAuth, async (req, res) => {
  try {
    // User is already attached by requireAuth middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        role: user.user_metadata?.role || 'viewer',
        created_at: user.created_at
      }
    });

  } catch (err) {
    logger.error('Get user error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

module.exports = router;
