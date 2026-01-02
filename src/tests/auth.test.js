import { setupTestDB, setupTestEnv } from './setup.js';
import { User } from '../models/index.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken
} from '../services/auth.service.js';

// Setup
setupTestEnv();
setupTestDB();

describe('Auth Service', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword('WrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    let testUser;

    beforeEach(async () => {
      const passwordHash = await hashPassword('TestPassword123!');
      testUser = await User.create({
        email: 'test@example.com',
        passwordHash,
        role: 'admin',
        name: 'Test User'
      });
    });

    it('should generate an access token', () => {
      const token = generateAccessToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should generate a refresh token', async () => {
      const token = await generateRefreshToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128); // 64 bytes as hex
    });

    it('should verify a valid refresh token', async () => {
      const token = await generateRefreshToken(testUser);
      const userId = await verifyRefreshToken(token);
      
      expect(userId).toBeDefined();
      expect(userId.toString()).toBe(testUser._id.toString());
    });

    it('should reject an invalid refresh token', async () => {
      const userId = await verifyRefreshToken('invalid-token');
      expect(userId).toBeNull();
    });

    it('should revoke a refresh token', async () => {
      const token = await generateRefreshToken(testUser);
      
      // Revoke the token
      const revoked = await revokeRefreshToken(token);
      expect(revoked).toBe(true);
      
      // Verify it's no longer valid
      const userId = await verifyRefreshToken(token);
      expect(userId).toBeNull();
    });
  });
});

describe('User Model', () => {
  it('should create a valid admin user', async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    const user = await User.create({
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      name: 'Admin User'
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe('admin@test.com');
    expect(user.role).toBe('admin');
    expect(user.businessId).toBeUndefined();
  });

  it('should require email', async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    
    await expect(User.create({
      passwordHash,
      role: 'admin'
    })).rejects.toThrow();
  });

  it('should require unique email', async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    
    await User.create({
      email: 'unique@test.com',
      passwordHash,
      role: 'admin'
    });

    await expect(User.create({
      email: 'unique@test.com',
      passwordHash,
      role: 'admin'
    })).rejects.toThrow();
  });

  it('should only allow valid roles', async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    
    await expect(User.create({
      email: 'test@test.com',
      passwordHash,
      role: 'invalid_role'
    })).rejects.toThrow();
  });
});
