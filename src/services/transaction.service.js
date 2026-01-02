import mongoose from 'mongoose';
import { Client, Item, Transaction, Business } from '../models/index.js';
import { ApiError } from '../middlewares/errorHandler.js';

/**
 * Process a points operation using an item (earn or redeem)
 * Uses MongoDB transactions for atomicity
 * 
 * @param {Object} params - Operation parameters
 * @param {string} params.clientObjectId - Client MongoDB ObjectId
 * @param {string} params.itemId - Item MongoDB ObjectId
 * @param {string} params.performedBy - User ObjectId who performed the operation
 * @param {string} params.note - Optional note
 * @returns {Promise<Object>} Transaction result
 */
const processPointsOperation = async ({ clientObjectId, itemId, performedBy, note }) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Load client with session
    const client = await Client.findById(clientObjectId).session(session);
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }

    // Load item
    const item = await Item.findById(itemId).session(session);
    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    // Verify item belongs to same business as client
    if (item.businessId.toString() !== client.businessId.toString()) {
      throw new ApiError(400, 'Item does not belong to the same business as the client');
    }

    // Load business to check settings
    const business = await Business.findById(client.businessId).session(session);
    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    // Calculate points change
    const beforePoints = client.points;
    let pointsChange;

    if (item.type === 'earn') {
      pointsChange = item.points; // Add points
    } else if (item.type === 'redeem') {
      pointsChange = -item.points; // Subtract points
    } else {
      throw new ApiError(400, 'Invalid item type');
    }

    const afterPoints = beforePoints + pointsChange;

    // Check for negative balance
    if (afterPoints < 0 && !business.allowNegativePoints) {
      throw new ApiError(400, `Insufficient points. Current balance: ${beforePoints}, required: ${item.points}`);
    }

    // Update client points
    await Client.findByIdAndUpdate(
      clientObjectId,
      { points: afterPoints },
      { session }
    );

    // Create transaction record
    const transaction = await Transaction.create(
      [{
        clientId: clientObjectId,
        businessId: client.businessId,
        itemId: item._id,
        points: pointsChange,
        beforePoints,
        afterPoints,
        performedBy,
        note: note || `${item.type === 'earn' ? 'Earned' : 'Redeemed'}: ${item.name}`
      }],
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      beforePoints,
      afterPoints,
      pointsChange,
      transaction: transaction[0]
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process a manual points adjustment
 * Uses MongoDB transactions for atomicity
 * 
 * @param {Object} params - Operation parameters
 * @param {string} params.clientObjectId - Client MongoDB ObjectId
 * @param {number} params.pointsChange - Points to add (positive) or subtract (negative)
 * @param {string} params.performedBy - User ObjectId who performed the operation
 * @param {string} params.note - Optional note
 * @returns {Promise<Object>} Transaction result
 */
const processManualAdjustment = async ({ clientObjectId, pointsChange, performedBy, note }) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Load client with session
    const client = await Client.findById(clientObjectId).session(session);
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }

    // Load business to check settings
    const business = await Business.findById(client.businessId).session(session);
    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    const beforePoints = client.points;
    const afterPoints = beforePoints + pointsChange;

    // Check for negative balance
    if (afterPoints < 0 && !business.allowNegativePoints) {
      throw new ApiError(400, `Operation would result in negative balance: ${afterPoints}. Current balance: ${beforePoints}`);
    }

    // Update client points
    await Client.findByIdAndUpdate(
      clientObjectId,
      { points: afterPoints },
      { session }
    );

    // Create transaction record
    const transaction = await Transaction.create(
      [{
        clientId: clientObjectId,
        businessId: client.businessId,
        itemId: null,
        points: pointsChange,
        beforePoints,
        afterPoints,
        performedBy,
        note: note || `Manual adjustment: ${pointsChange > 0 ? '+' : ''}${pointsChange} points`
      }],
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      beforePoints,
      afterPoints,
      pointsChange,
      transaction: transaction[0]
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export { processPointsOperation, processManualAdjustment };
