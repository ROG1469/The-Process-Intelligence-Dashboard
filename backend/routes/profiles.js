const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { requireAuth, requireRole } = require('../utils/jwtValidator');
const logger = require('../utils/logger');

/**
 * GET /api/profiles/me
 * Get current user's profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Profile fetch error', { userId, error: error.message });
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch profile'
      });
    }

    // If no profile exists, create default one
    if (!profile) {
      const defaultProfile = {
        user_id: userId,
        role: 'viewer',
        preferences: {
          theme: 'dark',
          notifications_enabled: true,
          default_time_range: '1h'
        }
      };

      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (createError) {
        logger.error('Profile creation error', { userId, error: createError.message });
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to create profile'
        });
      }

      return res.status(200).json({
        success: true,
        profile: newProfile
      });
    }

    res.status(200).json({
      success: true,
      profile
    });

  } catch (err) {
    logger.error('Get profile error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * PUT /api/profiles/me
 * Update current user's profile
 */
router.put('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences, display_name } = req.body;

    const updates = {};
    if (preferences) updates.preferences = preferences;
    if (display_name) updates.display_name = display_name;
    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Profile update error', { userId, error: error.message });
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to update profile'
      });
    }

    logger.info('Profile updated', { userId });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });

  } catch (err) {
    logger.error('Update profile error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/profiles
 * Get all user profiles (admin only)
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Profiles fetch error', { error: error.message });
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch profiles'
      });
    }

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles
    });

  } catch (err) {
    logger.error('Get profiles error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * PUT /api/profiles/:userId/role
 * Update user role (admin only)
 */
router.put('/:userId/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'manager', 'viewer'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be admin, manager, or viewer'
      });
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Role update error', { userId, error: error.message });
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to update role'
      });
    }

    logger.info('User role updated', { userId, newRole: role, updatedBy: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      profile
    });

  } catch (err) {
    logger.error('Update role error', { error: err.message });
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

module.exports = router;
