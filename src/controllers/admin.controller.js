import mongoose from 'mongoose';
import { User, Business, Client, Transaction } from '../models/index.js';
import { hashPassword } from '../services/auth.service.js';
import { generateClientId } from '../services/clientId.service.js';
import { generateQRDataUrl } from '../services/qrcode.service.js';
import { ApiError } from '../middlewares/errorHandler.js';
import { escapeRegExp } from '../utils.js';

/**
 * Create a new business
 * POST /api/admin/businesses
 */
const createBusiness = async (req, res, next) => {
  try {
    const { name, category, city, region, contactEmail, logoUrl, allowNegativePoints } = req.body;

    const business = await Business.create({
      name,
      category,
      city,
      region,
      contactEmail,
      logoUrl,
      allowNegativePoints: allowNegativePoints || false,
      createdByAdminId: req.user._id
    });

    res.status(201).json({
      success: true,
      business
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List/search businesses with pagination
 * GET /api/admin/businesses
 */
const listBusinesses = async (req, res, next) => {
  try {
    const { q, city, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (city) {
      query.city = new RegExp(escapeRegExp(city), 'i');
    }

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Business.countDocuments(query)
    ]);

    res.json({
      success: true,
      businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get business by ID
 * GET /api/admin/businesses/:businessId
 */
const getBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    const business = await Business.findById(businessId);
    
    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    res.json({
      success: true,
      business
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update business details
 * PUT /api/admin/businesses/:businessId
 */
const updateBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    // Allowed fields to update by admin
    const allowedUpdates = ['name', 'category', 'city', 'region', 'contactEmail', 'logoUrl', 'allowNegativePoints', 'cardDesign'];
    const sanitizedUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });
    
    // Explicitly handle cardDesign to ensure it merges or overwrites correctly as expected
    // For Mongoose, setting nested objects usually works fine with $set
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true }
    );

    if (!business) {
        throw new ApiError(404, 'Business not found');
    }

    res.json({
      success: true,
      business
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete business
 * DELETE /api/admin/businesses/:businessId
 */
const deleteBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    // Optional: Cascade delete clients, transactions, users
    // For now, we perform a hard delete of the business document.
    // In a real app, we might want to keep data or do soft delete.
    // For this rigorous implementation, let's delete related clients to prevent orphans.
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const business = await Business.findByIdAndDelete(businessId).session(session);
      
      if (!business) {
        throw new ApiError(404, 'Business not found');
      }

      // Delete associated clients
      await Client.deleteMany({ businessId }).session(session);
      
      // Delete associated transactions
      await Transaction.deleteMany({ businessId }).session(session);

      // Delete associated users (business_user role)
      await User.deleteMany({ businessId }).session(session);

      await session.commitTransaction();
      
      res.json({
        success: true,
        message: 'Business and all associated data deleted successfully'
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Create a business user (employee)
 * POST /api/admin/businesses/:businessId/users
 */
const createBusinessUser = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { email, password, name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    // Verify business exists
    const business = await Business.findById(businessId);
    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'business_user',
      businessId
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a client for a business (generates clientId and QR)
 * POST /api/admin/businesses/:businessId/clients
 */
const createClient = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { name, phone, email, initialPoints, metadata } = req.body;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    // Verify business exists
    const business = await Business.findById(businessId);
    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    // Generate unique clientId
    const clientId = await generateClientId(businessId);

    // Create client
    const client = await Client.create({
      businessId,
      clientId,
      name,
      phone,
      email,
      points: initialPoints || 0,
      metadata: metadata || {}
    });

    // Generate QR code using business slug and client ID
    const qrDataUrl = await generateQRDataUrl(business.slug, clientId);

    res.status(201).json({
      success: true,
      client,
      qrDataUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List clients for a business with pagination
 * GET /api/admin/businesses/:businessId/clients
 */
const listClients = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    // Build query
    const query = { businessId };
    
    if (q) {
      const escapedQ = escapeRegExp(q);
      query.$or = [
        { clientId: new RegExp(escapedQ, 'i') },
        { name: new RegExp(escapedQ, 'i') },
        { phone: new RegExp(escapedQ, 'i') },
        { email: new RegExp(escapedQ, 'i') }
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Client.countDocuments(query)
    ]);

    res.json({
      success: true,
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View platform-wide transactions (with filters)
 * GET /api/admin/transactions
 */
const listTransactions = async (req, res, next) => {
  try {
    const { businessId, clientId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (businessId && mongoose.Types.ObjectId.isValid(businessId)) {
      query.businessId = businessId;
    }
    
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = clientId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('clientId', 'clientId name')
        .populate('businessId', 'name')
        .populate('itemId', 'name type')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk generate clients for a business
 * POST /api/admin/businesses/:businessId/clients/generate
 */
const generateClients = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { count } = req.body;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    if (!count || isNaN(count) || count <= 0) {
      throw new ApiError(400, 'Invalid count. Must be a positive number.');
    }

    // Verify business exists
    const business = await Business.findById(businessId);
    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    // Find all clients with pattern client<number> for this business
    const clients = await Client.find({
      businessId,
      clientId: { $regex: /^client\d+$/ }
    }).select('clientId').lean();

    // Find max number
    let maxNum = 0;
    clients.forEach(c => {
      const num = parseInt(c.clientId.replace('client', ''), 10);
      if (num > maxNum) maxNum = num;
    });

    const newClients = [];
    const createdClients = [];

    for (let i = 1; i <= count; i++) {
      const nextNum = maxNum + i;
      const clientId = `client${nextNum}`;
      
      newClients.push({
        businessId,
        clientId,
        name: `Client ${nextNum}`,
        points: 0
      });
    }

    // Bulk create
    if (newClients.length > 0) {
      const result = await Client.insertMany(newClients);
      createdClients.push(...result);
      
      // Generate QRs for all new clients
      // Note: Ideally this should be a background job if count is large
      // For now we assume reasonable counts (< 100)
    }

    res.status(201).json({
      success: true,
      count: createdClients.length,
      message: `Successfully generated ${createdClients.length} clients`,
      lastClientId: createdClients.length > 0 ? createdClients[createdClients.length - 1].clientId : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List business users (employees)
 * GET /api/admin/businesses/:businessId/users
 */
const listBusinessUsers = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    const users = await User.find({ 
      businessId, 
      role: 'business_user' 
    }).select('-passwordHash').sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update business user
 * PUT /api/admin/businesses/:businessId/users/:userId
 */
const updateBusinessUser = async (req, res, next) => {
  try {
    const { businessId, userId } = req.params;
    const { email, password, name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid ID(s)');
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, businessId, role: 'business_user' },
      updateData,
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete business user
 * DELETE /api/admin/businesses/:businessId/users/:userId
 */
const deleteBusinessUser = async (req, res, next) => {
  try {
    const { businessId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(businessId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid ID(s)');
    }

    const user = await User.findOneAndDelete({ 
      _id: userId, 
      businessId, 
      role: 'business_user' 
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export {
  createBusiness,
  listBusinesses,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  createBusinessUser,
  listBusinessUsers,
  updateBusinessUser,
  deleteBusinessUser,
  createClient,
  generateClients,
  listClients,
  listTransactions
};
