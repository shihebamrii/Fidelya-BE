import { User } from '../models/index.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken
} from '../services/auth.service.js';
import { ApiError } from '../middlewares/errorHandler.js';

/**
 * Login user (admin or business_user)
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const isMatch = await comparePassword(password, user.passwordHash);
    
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshToken);
    
    if (!userId) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (revoke refresh token)
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Revoke the refresh token
    await revokeRefreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export { login, refresh, logout };
