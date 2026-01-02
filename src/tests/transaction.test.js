import { setupTestDB, setupTestEnv } from './setup.js';
import mongoose from 'mongoose';
import { Business, User, Client, Item, Transaction } from '../models/index.js';
import { hashPassword } from '../services/auth.service.js';
import { processPointsOperation, processManualAdjustment } from '../services/transaction.service.js';

// Setup
setupTestEnv();
setupTestDB();

describe('Transaction Service', () => {
  let business;
  let adminUser;
  let businessUser;
  let client;
  let earnItem;
  let redeemItem;

  beforeEach(async () => {
    // Create admin
    const adminPasswordHash = await hashPassword('AdminPass123!');
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      name: 'Test Admin'
    });

    // Create business
    business = await Business.create({
      name: 'Test Cafe',
      city: 'Paris',
      allowNegativePoints: false,
      createdByAdminId: adminUser._id
    });

    // Create business user
    const userPasswordHash = await hashPassword('UserPass123!');
    businessUser = await User.create({
      email: 'employee@test.com',
      passwordHash: userPasswordHash,
      role: 'business_user',
      businessId: business._id,
      name: 'Test Employee'
    });

    // Create client with 100 points
    client = await Client.create({
      businessId: business._id,
      clientId: 'TEST-ABC123',
      name: 'John Doe',
      points: 100
    });

    // Create earn item (10 points)
    earnItem = await Item.create({
      businessId: business._id,
      name: 'Coffee Purchase',
      points: 10,
      type: 'earn'
    });

    // Create redeem item (50 points)
    redeemItem = await Item.create({
      businessId: business._id,
      name: 'Free Pastry',
      points: 50,
      type: 'redeem'
    });
  });

  describe('processPointsOperation', () => {
    it('should add points with earn item', async () => {
      const result = await processPointsOperation({
        clientObjectId: client._id,
        itemId: earnItem._id,
        performedBy: businessUser._id,
        note: 'Coffee purchased'
      });

      expect(result.success).toBe(true);
      expect(result.beforePoints).toBe(100);
      expect(result.afterPoints).toBe(110);
      expect(result.pointsChange).toBe(10);

      // Verify client was updated
      const updatedClient = await Client.findById(client._id);
      expect(updatedClient.points).toBe(110);

      // Verify transaction was created
      const transaction = await Transaction.findById(result.transaction._id);
      expect(transaction).toBeDefined();
      expect(transaction.points).toBe(10);
    });

    it('should deduct points with redeem item', async () => {
      const result = await processPointsOperation({
        clientObjectId: client._id,
        itemId: redeemItem._id,
        performedBy: businessUser._id,
        note: 'Redeemed pastry'
      });

      expect(result.success).toBe(true);
      expect(result.beforePoints).toBe(100);
      expect(result.afterPoints).toBe(50);
      expect(result.pointsChange).toBe(-50);

      // Verify client was updated
      const updatedClient = await Client.findById(client._id);
      expect(updatedClient.points).toBe(50);
    });

    it('should reject redemption with insufficient points', async () => {
      // Create a large redeem item
      const largeRedeemItem = await Item.create({
        businessId: business._id,
        name: 'Big Prize',
        points: 200,
        type: 'redeem'
      });

      await expect(processPointsOperation({
        clientObjectId: client._id,
        itemId: largeRedeemItem._id,
        performedBy: businessUser._id
      })).rejects.toThrow(/Insufficient points/);

      // Verify client points unchanged
      const updatedClient = await Client.findById(client._id);
      expect(updatedClient.points).toBe(100);
    });

    it('should allow negative balance when business allows it', async () => {
      // Update business to allow negative points
      await Business.findByIdAndUpdate(business._id, { allowNegativePoints: true });

      const largeRedeemItem = await Item.create({
        businessId: business._id,
        name: 'Big Prize',
        points: 200,
        type: 'redeem'
      });

      const result = await processPointsOperation({
        clientObjectId: client._id,
        itemId: largeRedeemItem._id,
        performedBy: businessUser._id
      });

      expect(result.success).toBe(true);
      expect(result.afterPoints).toBe(-100);
    });
  });

  describe('processManualAdjustment', () => {
    it('should add points manually', async () => {
      const result = await processManualAdjustment({
        clientObjectId: client._id,
        pointsChange: 25,
        performedBy: businessUser._id,
        note: 'Bonus points'
      });

      expect(result.success).toBe(true);
      expect(result.beforePoints).toBe(100);
      expect(result.afterPoints).toBe(125);

      // Verify client was updated
      const updatedClient = await Client.findById(client._id);
      expect(updatedClient.points).toBe(125);
    });

    it('should deduct points manually', async () => {
      const result = await processManualAdjustment({
        clientObjectId: client._id,
        pointsChange: -30,
        performedBy: businessUser._id,
        note: 'Adjustment'
      });

      expect(result.success).toBe(true);
      expect(result.afterPoints).toBe(70);
    });

    it('should reject manual deduction resulting in negative balance', async () => {
      await expect(processManualAdjustment({
        clientObjectId: client._id,
        pointsChange: -150,
        performedBy: businessUser._id
      })).rejects.toThrow(/negative balance/);
    });

    it('should create transaction without itemId', async () => {
      const result = await processManualAdjustment({
        clientObjectId: client._id,
        pointsChange: 50,
        performedBy: businessUser._id
      });

      const transaction = await Transaction.findById(result.transaction._id);
      expect(transaction.itemId).toBeUndefined();
    });
  });
});
