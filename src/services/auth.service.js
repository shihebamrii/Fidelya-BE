import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from '../models/index.js';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Match result
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    businessId: user.businessId || null
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    algorithm: 'HS256',
    issuer: 'fidelya-backend',
    audience: 'fidelya-app',
    jwtid: crypto.randomBytes(16).toString('hex')
  });
};

/**
 * Generate refresh token and store in database
 * @param {Object} user - User object
 * @returns {Promise<string>} Refresh token
 */
const generateRefreshToken = async (user) => {
  // Generate random token
  const token = crypto.randomBytes(64).toString('hex');
  
  // Calculate expiry
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const expiresAt = new Date();
  
  // Parse expiry string (e.g., '7d', '24h')
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
    expiresAt.setTime(expiresAt.getTime() + value * multipliers[unit]);
  } else {
    // Default 7 days
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  // Store hashed token in database
  await RefreshToken.create({
    token: crypto.createHash('sha256').update(token).digest('hex'),
    userId: user._id,
    expiresAt
  });

  return token;
};

/**
 * Verify refresh token and return associated user ID
 * @param {string} token - Refresh token
 * @returns {Promise<string|null>} User ID or null if invalid
 */
const verifyRefreshToken = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const refreshToken = await RefreshToken.findOne({
    token: hashedToken,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });

  if (!refreshToken) {
    return null;
  }

  return refreshToken.userId;
};

/**
 * Revoke a refresh token
 * @param {string} token - Refresh token to revoke
 * @returns {Promise<boolean>} Success status
 */
const revokeRefreshToken = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const result = await RefreshToken.updateOne(
    { token: hashedToken },
    { isRevoked: true }
  );

  return result.modifiedCount > 0;
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of tokens revoked
 */
const revokeAllUserTokens = async (userId) => {
  const result = await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );

  return result.modifiedCount;
};

export {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
};
