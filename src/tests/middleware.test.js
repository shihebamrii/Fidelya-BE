import { setupTestDB, setupTestEnv } from './setup.js';
import {
  roleMiddleware,
  businessOwnershipMiddleware
} from '../middlewares/role.js';
import { User, Business } from '../models/index.js';
import { hashPassword } from '../services/auth.service.js';

// Setup
setupTestEnv();
setupTestDB();

describe('Role Middleware', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('roleMiddleware', () => {
    it('should allow admin access to admin routes', () => {
      const req = { user: { role: 'admin' } };
      const res = mockRes();
      
      roleMiddleware(['admin'])(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny business_user access to admin routes', () => {
      const req = { user: { role: 'business_user' } };
      const res = mockRes();
      
      roleMiddleware(['admin'])(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow business_user access to business routes', () => {
      const req = { user: { role: 'business_user' } };
      const res = mockRes();
      
      roleMiddleware(['business_user', 'admin'])(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when no user is attached', () => {
      const req = {};
      const res = mockRes();
      
      roleMiddleware(['admin'])(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('businessOwnershipMiddleware', () => {
    let business;
    let businessUser;

    beforeEach(async () => {
      const adminPasswordHash = await hashPassword('AdminPass123!');
      const adminUser = await User.create({
        email: 'admin@test.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        name: 'Test Admin'
      });

      business = await Business.create({
        name: 'Test Business',
        createdByAdminId: adminUser._id
      });

      const userPasswordHash = await hashPassword('UserPass123!');
      businessUser = await User.create({
        email: 'user@test.com',
        passwordHash: userPasswordHash,
        role: 'business_user',
        businessId: business._id,
        name: 'Test User'
      });
    });

    it('should allow admin access to any business', () => {
      const req = {
        user: { role: 'admin' },
        params: { businessId: business._id.toString() }
      };
      const res = mockRes();
      
      businessOwnershipMiddleware()(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow business_user access to their own business', () => {
      const req = {
        user: {
          role: 'business_user',
          businessId: business._id
        },
        params: { businessId: business._id.toString() }
      };
      const res = mockRes();
      
      businessOwnershipMiddleware()(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny business_user access to other businesses', async () => {
      const adminPasswordHash = await hashPassword('Admin2Pass123!');
      const admin2 = await User.create({
        email: 'admin2@test.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        name: 'Test Admin 2'
      });

      const otherBusiness = await Business.create({
        name: 'Other Business',
        createdByAdminId: admin2._id
      });

      const req = {
        user: {
          role: 'business_user',
          businessId: business._id
        },
        params: { businessId: otherBusiness._id.toString() }
      };
      const res = mockRes();
      
      businessOwnershipMiddleware()(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
