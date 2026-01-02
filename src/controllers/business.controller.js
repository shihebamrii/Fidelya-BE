import mongoose from 'mongoose';
import { Item, Client, Transaction, Business } from '../models/index.js';
import { processPointsOperation, processManualAdjustment } from '../services/transaction.service.js';
import { generateQRDataUrl } from '../services/qrcode.service.js';
import { ApiError } from '../middlewares/errorHandler.js';
import { escapeRegExp } from '../utils.js';

/**
 * Create an item (earn/redeem) for the business
 * POST /api/business/items
 */
const createItem = async (req, res, next) => {
  try {
    const { name, description, points, type, visibleToClient } = req.body;
    const businessId = req.user.businessId;

    if (!businessId) {
      throw new ApiError(403, 'No business associated with this account. Please log in as a business user.');
    }

    const item = await Item.create({
      businessId,
      name,
      description,
      points,
      type,
      visibleToClient: visibleToClient !== false
    });

    res.status(201).json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List items for the business
 * GET /api/business/items
 */
const listItems = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const { type } = req.query;

    const query = { businessId };
    if (type && ['earn', 'redeem'].includes(type)) {
      query.type = type;
    }

    const items = await Item.find(query)
      .sort({ type: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      items
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an item
 * PUT /api/business/items/:itemId
 */
const updateItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const businessId = req.user.businessId;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw new ApiError(400, 'Invalid item ID');
    }

    const item = await Item.findOneAndUpdate(
      { _id: itemId, businessId },
      updates,
      { new: true, runValidators: true }
    );

    if (!item) {
      throw new ApiError(404, 'Item not found or access denied');
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an item
 * DELETE /api/business/items/:itemId
 */
const deleteItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const businessId = req.user.businessId;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw new ApiError(400, 'Invalid item ID');
    }

    const item = await Item.findOneAndDelete({ _id: itemId, businessId });

    if (!item) {
      throw new ApiError(404, 'Item not found or access denied');
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or deduct points using an item
 * POST /api/business/clients/:clientId/points
 */
const addPoints = async (req, res, next) => {
  try {
    const { itemId, note } = req.body;
    const client = req.client; // Set by clientOwnershipMiddleware

    const result = await processPointsOperation({
      clientObjectId: client._id,
      itemId,
      performedBy: req.user._id,
      note
    });

    res.json({
      success: true,
      beforePoints: result.beforePoints,
      afterPoints: result.afterPoints,
      transaction: result.transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual points adjustment
 * POST /api/business/clients/:clientId/manual
 */
const manualPointsAdjust = async (req, res, next) => {
  try {
    const { pointsChange, note } = req.body;
    const client = req.client; // Set by clientOwnershipMiddleware

    const result = await processManualAdjustment({
      clientObjectId: client._id,
      pointsChange,
      performedBy: req.user._id,
      note
    });

    res.json({
      success: true,
      beforePoints: result.beforePoints,
      afterPoints: result.afterPoints,
      transaction: result.transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client profile with recent transactions
 * GET /api/business/clients/:clientId
 */
const getClient = async (req, res, next) => {
  try {
    const client = req.client; // Set by clientOwnershipMiddleware

    // Get recent transactions
    const transactions = await Transaction.find({ clientId: client._id })
      .populate('itemId', 'name type')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Generate QR data URL
    const qrDataUrl = await generateQRDataUrl(client.clientId);

    res.json({
      success: true,
      client,
      transactions,
      qrDataUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List transactions for the business
 * GET /api/business/transactions
 */
const listTransactions = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const { clientId, itemId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { businessId };
    
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = clientId;
    }
    
    if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
      query.itemId = itemId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('clientId', 'clientId name')
        .populate('itemId', 'name type points')
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
 * Search clients for the business
 * GET /api/business/clients/search
 */
const searchClients = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

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
        .sort({ name: 1 })
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
 * Update business profile (including card design)
 * PUT /api/business/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const updates = req.body;

    // Allowed fields to update
    const allowedUpdates = ['name', 'city', 'logoUrl', 'cardDesign'];
    const sanitizedUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });

    // Check if cardDesign is present and is an object
    if (updates.cardDesign && typeof updates.cardDesign === 'object') {
       sanitizedUpdates.cardDesign = { ...updates.cardDesign };
    }


    const business = await Business.findOneAndUpdate(
      { _id: businessId },
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

export {
  createItem,
  listItems,
  updateItem,
  deleteItem,
  addPoints,
  manualPointsAdjust,
  getClient,
  listTransactions,
  searchClients,
  updateProfile
};
