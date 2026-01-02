import { setupTestDB, setupTestEnv } from './setup.js';
import { Business, User, Client, Item } from '../models/index.js';
import { hashPassword } from '../services/auth.service.js';
import { generateClientId } from '../services/clientId.service.js';
import { generateQRDataUrl } from '../services/qrcode.service.js';

// Setup
setupTestEnv();
setupTestDB();

describe('Business Model', () => {
  let adminUser;

  beforeEach(async () => {
    const passwordHash = await hashPassword('AdminPass123!');
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      name: 'Test Admin'
    });
  });

  it('should create a valid business', async () => {
    const business = await Business.create({
      name: 'Test Business',
      category: 'Retail',
      city: 'Paris',
      createdByAdminId: adminUser._id
    });

    expect(business._id).toBeDefined();
    expect(business.name).toBe('Test Business');
    expect(business.allowNegativePoints).toBe(false);
  });

  it('should require name', async () => {
    await expect(Business.create({
      category: 'Retail',
      createdByAdminId: adminUser._id
    })).rejects.toThrow();
  });

  it('should require createdByAdminId', async () => {
    await expect(Business.create({
      name: 'Test Business'
    })).rejects.toThrow();
  });
});

describe('Client Model', () => {
  let business;
  let adminUser;

  beforeEach(async () => {
    const passwordHash = await hashPassword('AdminPass123!');
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      name: 'Test Admin'
    });

    business = await Business.create({
      name: 'Test Cafe',
      city: 'Paris',
      createdByAdminId: adminUser._id
    });
  });

  it('should create a valid client', async () => {
    const client = await Client.create({
      businessId: business._id,
      clientId: 'TEST-ABC123',
      name: 'John Doe',
      phone: '+33612345678',
      email: 'john@example.com',
      points: 100
    });

    expect(client._id).toBeDefined();
    expect(client.clientId).toBe('TEST-ABC123');
    expect(client.points).toBe(100);
  });

  it('should default points to 0', async () => {
    const client = await Client.create({
      businessId: business._id,
      clientId: 'TEST-DEF456',
      name: 'Jane Doe'
    });

    expect(client.points).toBe(0);
  });

  it('should require unique clientId', async () => {
    await Client.create({
      businessId: business._id,
      clientId: 'UNIQUE-123',
      name: 'User 1'
    });

    await expect(Client.create({
      businessId: business._id,
      clientId: 'UNIQUE-123',
      name: 'User 2'
    })).rejects.toThrow();
  });
});

describe('ClientId Service', () => {
  let business;
  let adminUser;

  beforeEach(async () => {
    const passwordHash = await hashPassword('AdminPass123!');
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      name: 'Test Admin'
    });

    business = await Business.create({
      name: 'My Coffee Shop',
      city: 'Paris',
      createdByAdminId: adminUser._id
    });
  });

  it('should generate a unique clientId', async () => {
    const clientId = await generateClientId(business._id);
    
    expect(clientId).toBeDefined();
    expect(typeof clientId).toBe('string');
    expect(clientId.includes('-')).toBe(true);
  });

  it('should generate IDs with business prefix', async () => {
    const clientId = await generateClientId(business._id);
    
    // Should start with first 4 chars of business name (uppercase)
    expect(clientId.startsWith('MYCO-')).toBe(true);
  });

  it('should generate unique IDs', async () => {
    const id1 = await generateClientId(business._id);
    const id2 = await generateClientId(business._id);
    
    expect(id1).not.toBe(id2);
  });
});

describe('QR Code Service', () => {
  it('should generate a data URL', async () => {
    const clientId = 'TEST-ABC123';
    const qrDataUrl = await generateQRDataUrl(clientId);
    
    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });
});

describe('Item Model', () => {
  let business;
  let adminUser;

  beforeEach(async () => {
    const passwordHash = await hashPassword('AdminPass123!');
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      name: 'Test Admin'
    });

    business = await Business.create({
      name: 'Test Cafe',
      city: 'Paris',
      createdByAdminId: adminUser._id
    });
  });

  it('should create an earn item', async () => {
    const item = await Item.create({
      businessId: business._id,
      name: 'Coffee Purchase',
      points: 10,
      type: 'earn'
    });

    expect(item._id).toBeDefined();
    expect(item.type).toBe('earn');
    expect(item.points).toBe(10);
  });

  it('should create a redeem item', async () => {
    const item = await Item.create({
      businessId: business._id,
      name: 'Free Coffee',
      points: 100,
      type: 'redeem'
    });

    expect(item._id).toBeDefined();
    expect(item.type).toBe('redeem');
  });

  it('should require valid type', async () => {
    await expect(Item.create({
      businessId: business._id,
      name: 'Invalid Item',
      points: 50,
      type: 'invalid'
    })).rejects.toThrow();
  });

  it('should require positive points', async () => {
    await expect(Item.create({
      businessId: business._id,
      name: 'Zero Points',
      points: 0,
      type: 'earn'
    })).rejects.toThrow();
  });
});
