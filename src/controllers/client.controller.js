import { Client, Business, Item, Transaction } from '../models/index.js';
import { generateQRDataUrl } from '../services/qrcode.service.js';
import { ApiError } from '../middlewares/errorHandler.js';

/**
 * Get client dashboard (public read-only view)
 * GET /api/client/:clientId
 */
const getDashboard = async (req, res, next) => {
  try {
    const { businessSlug, clientId } = req.params;

    // 1. Find business by slug
    const business = await Business.findOne({ slug: businessSlug })
      .select('name category city logoUrl cardDesign slug')
      .lean();

    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    // 2. Find client by businessId AND clientId string
    const client = await Client.findOne({ 
      businessId: business._id, 
      clientId: clientId 
    })
      .select('-metadata')
      .lean();

    if (!client) {
      throw new ApiError(404, 'Client not found');
    }

    // Get available rewards (redeem items visible to client)
    const availableRewards = await Item.find({
      businessId: client.businessId,
      type: 'redeem',
      visibleToClient: true
    })
      .select('name description points')
      .sort({ points: 1 })
      .lean();

    // Get recent transactions (last 10)
    const transactions = await Transaction.find({ clientId: client._id })
      .populate('itemId', 'name type')
      .select('points beforePoints afterPoints note createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      client: {
        clientId: client.clientId,
        name: client.name,
        points: client.points,
        isActivated: client.isActivated
      },
      business,
      availableRewards,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate client card
 * POST /api/client/:businessSlug/:clientId/activate
 */
const activateClient = async (req, res, next) => {
  try {
    const { businessSlug, clientId } = req.params;
    const { name, activationCode } = req.body;

    if (!name || !activationCode) {
      throw new ApiError(400, 'Name and activation code are required');
    }

    // 1. Find business
    const business = await Business.findOne({ slug: businessSlug });
    if (!business) {
      throw new ApiError(404, 'Business not found');
    }

    // 2. Verify activation code
    if (business.activationCode && business.activationCode !== activationCode) {
      throw new ApiError(403, 'Invalid activation code');
    }

    // 3. Find client
    const client = await Client.findOne({ 
      businessId: business._id, 
      clientId: clientId 
    });

    if (!client) {
      throw new ApiError(404, 'Client not found');
    }

    if (client.isActivated) {
      throw new ApiError(400, 'Client is already activated');
    }

    // 4. Update client
    client.name = name;
    client.isActivated = true;
    await client.save();

    res.json({
      success: true,
      message: 'Card activated successfully',
      client: {
        clientId: client.clientId,
        name: client.name,
        isActivated: client.isActivated
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get QR code for client
 * GET /api/client/:clientId/qr
 */
const getQR = async (req, res, next) => {
  try {
    const { businessSlug, clientId } = req.params;

    // Find business
    const business = await Business.findOne({ slug: businessSlug });
    if (!business) throw new ApiError(404, 'Business not found');

    // Find client
    const client = await Client.findOne({ businessId: business._id, clientId });
    if (!client) throw new ApiError(404, 'Client not found');

    // Generate QR code using slug and readable clientId
    const qrDataUrl = await generateQRDataUrl(business.slug, client.clientId);

    res.json({
      success: true,
      clientId: client.clientId,
      qrDataUrl
    });
  } catch (error) {
    next(error);
  }
};

export { getDashboard, activateClient, getQR };
