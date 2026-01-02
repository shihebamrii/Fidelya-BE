import { Router } from 'express';
import {
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
} from '../controllers/business.controller.js';
import {
  authMiddleware,
  roleMiddleware,
  clientOwnershipMiddleware,
  validateBody,
  validateQuery,
  pointsLimiter
} from '../middlewares/index.js';
import { createItemSchema, updateItemSchema } from '../validators/item.validator.js';
import { pointsOperationSchema, manualPointsSchema, searchClientSchema } from '../validators/client.validator.js';

const router = Router();

// All business routes require authentication and business_user role
router.use(authMiddleware);
router.use(roleMiddleware(['business_user', 'admin']));

/**
 * @swagger
 * /api/business/items:
 *   post:
 *     summary: Create an item (earn/redeem)
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - points
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               points:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [earn, redeem]
 *               visibleToClient:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Item created
 */
router.post('/items', validateBody(createItemSchema), createItem);

/**
 * @swagger
 * /api/business/items:
 *   get:
 *     summary: List items for the business
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [earn, redeem]
 *     responses:
 *       200:
 *         description: List of items
 */
router.get('/items', listItems);

/**
 * @swagger
 * /api/business/items/{itemId}:
 *   put:
 *     summary: Update an item
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               points:
 *                 type: integer
 *               visibleToClient:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Item updated
 */
router.put('/items/:itemId', validateBody(updateItemSchema), updateItem);

/**
 * @swagger
 * /api/business/items/{itemId}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted
 */
router.delete('/items/:itemId', deleteItem);

/**
 * @swagger
 * /api/business/clients/search:
 *   get:
 *     summary: Search clients
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of matching clients
 */
router.get('/clients/search', validateQuery(searchClientSchema), searchClients);

/**
 * @swagger
 * /api/business/clients/{clientId}/points:
 *   post:
 *     summary: Add or deduct points using an item
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *             properties:
 *               itemId:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Points operation successful
 */
router.post('/clients/:clientId/points', pointsLimiter, clientOwnershipMiddleware, validateBody(pointsOperationSchema), addPoints);

/**
 * @swagger
 * /api/business/clients/{clientId}/manual:
 *   post:
 *     summary: Manual points adjustment
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pointsChange
 *             properties:
 *               pointsChange:
 *                 type: integer
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Manual adjustment successful
 */
router.post('/clients/:clientId/manual', pointsLimiter, clientOwnershipMiddleware, validateBody(manualPointsSchema), manualPointsAdjust);

/**
 * @swagger
 * /api/business/clients/{clientId}:
 *   get:
 *     summary: Get client profile with recent transactions
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client profile with transactions
 */
router.get('/clients/:clientId', clientOwnershipMiddleware, getClient);

/**
 * @swagger
 * /api/business/transactions:
 *   get:
 *     summary: List transactions for the business
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/transactions', listTransactions);

/**
 * @swagger
 * /api/business/profile:
 *   put:
 *     summary: Update business profile and card design
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               cardDesign:
 *                 type: object
 *                 properties:
 *                   primaryColor:
 *                     type: string
 *                   secondaryColor:
 *                     type: string
 *                   pattern:
 *                     type: string
 *                   textColor:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', updateProfile);

export default router;
