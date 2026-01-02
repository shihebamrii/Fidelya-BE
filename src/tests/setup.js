import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Setup - runs once before all tests
export const setupTestDB = () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up all collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });
};

// Create test environment variables
export const setupTestEnv = () => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.NODE_ENV = 'test';
  process.env.CLIENT_DASHBOARD_URL = 'http://localhost:4000/client';
};
