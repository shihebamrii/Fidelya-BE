import mongoose from 'mongoose';

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Business ownership middleware - verifies business_user has access to the business
 * Must be used after authMiddleware
 */
const businessOwnershipMiddleware = (paramName = 'businessId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    // Admin can access any business
    if (req.user.role === 'admin') {
      return next();
    }

    // For business_user, verify they belong to the business
    if (req.user.role === 'business_user') {
      const businessId = req.params[paramName];
      
      if (!businessId) {
        return res.status(400).json({
          status: 'error',
          message: 'Business ID is required.'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid business ID format.'
        });
      }

      if (req.user.businessId.toString() !== businessId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You do not have access to this business.'
        });
      }
    }

    next();
  };
};

/**
 * Middleware to verify client belongs to user's business
 * For business users, checks if client belongs to their business
 */
const clientOwnershipMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    // Import Client model dynamically to avoid circular dependencies
    const { Client } = await import('../models/index.js');
    
    const clientIdParam = req.params.clientId;
    
    if (!clientIdParam) {
      return res.status(400).json({
        status: 'error',
        message: 'Client ID is required.'
      });
    }

    // Validate user first (already done by authMiddleware, but good to be safe)
    if (!req.user) {
         return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    let client;
    // const clientIdParam = req.params.clientId; // Already declared above

    
    // If it's a valid ObjectId, try finding by _id first (global lookup)
    // We check permissions after finding it.
    if (mongoose.Types.ObjectId.isValid(clientIdParam)) {
      client = await Client.findById(clientIdParam);
    }

    // If not found by ID (or not an ID), search by clientId field.
    if (!client) {
      if (req.user.role === 'business_user') {
        // PER-BUSINESS LOOKUP: business_user should only see their own clients
        client = await Client.findOne({ 
             clientId: clientIdParam, 
             businessId: req.user.businessId 
        });
      } else {
        // Admin or other: find just by clientId (might be ambiguous, but defaults to first found)
        // Ideally admin should use unique _id, but this keeps backward compat for now.
        client = await Client.findOne({ clientId: clientIdParam }); 
      }
    }

    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found.'
      });
    }

    // Admin can access any client
    if (req.user.role === 'admin') {
      req.client = client;
      return next();
    }

    // Business user can only access clients from their business
    if (req.user.role === 'business_user') {
      if (client.businessId.toString() !== req.user.businessId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. This client does not belong to your business.'
        });
      }
    }

    req.client = client;
    next();
  } catch (error) {
    next(error);
  }
};

export { roleMiddleware, businessOwnershipMiddleware, clientOwnershipMiddleware };
