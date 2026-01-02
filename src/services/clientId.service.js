import crypto from 'crypto';
import { Client, Business } from '../models/index.js';

/**
 * Generate a unique client ID for a business
 * Format: {BUSINESS_PREFIX}-{6-char-random}
 * Example: CAFE-X7F4P2
 * 
 * @param {string} businessId - Business ObjectId
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} Unique client ID
 */
const generateClientId = async (businessId, maxRetries = 5) => {
  const business = await Business.findById(businessId);
  
  if (!business) {
    throw new Error('Business not found');
  }

  // Create prefix from business name (first 4 chars, uppercase, alphanumeric only)
  const prefix = business.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate 6 character random alphanumeric string
    const randomPart = crypto.randomBytes(4)
      .toString('base64')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 6);

    const clientId = `${prefix}-${randomPart}`;

    // Check if this clientId already exists for THIS business
    const existing = await Client.findOne({ clientId, businessId });
    
    if (!existing) {
      return clientId;
    }
  }

  // Fallback: use timestamp + random for guaranteed uniqueness
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}${random}`.slice(0, 15);
};

/**
 * Validate client ID format
 * @param {string} clientId - Client ID to validate
 * @returns {boolean} Is valid format
 */
const isValidClientIdFormat = (clientId) => {
  // Format: 4 chars prefix, dash, 6 chars random
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{6,}$/;
  return pattern.test(clientId);
};

export { generateClientId, isValidClientIdFormat };
