import { Router } from 'express';
import {
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
} from '../controllers/admin.controller.js';
import { authMiddleware, roleMiddleware, validateBody, validateQuery, adminLimiter } from '../middlewares/index.js';
import { createBusinessSchema, searchBusinessSchema } from '../validators/business.validator.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';
import { createClientSchema, searchClientSchema } from '../validators/client.validator.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));
router.use(adminLimiter);

/**
 * @swagger
 * /api/admin/businesses:
 *   post:
 *     summary: Create a new business
 *     tags: [Admin]
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
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               city:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               allowNegativePoints:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Business created
 */
router.post('/businesses', validateBody(createBusinessSchema), createBusiness);

/**
 * @swagger
 * /api/admin/businesses:
 *   get:
 *     summary: List/search businesses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
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
 *         description: List of businesses
 */
router.get('/businesses', validateQuery(searchBusinessSchema), listBusinesses);

/**
 * @swagger
 * /api/admin/businesses/{businessId}:
 *   get:
 *     summary: Get business by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business details
 *       404:
 *         description: Business not found
 */
router.get('/businesses/:businessId', getBusiness);

/**
 * @swagger
 * /api/admin/businesses/{businessId}:
 *   put:
 *     summary: Update business details and card design
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cardDesign:
 *                 type: object
 *     responses:
 *       200:
 *         description: Business updated
 */
router.put('/businesses/:businessId', updateBusiness);

/**
 * @swagger
 * /api/admin/businesses/{businessId}:
 *   delete:
 *     summary: Delete business and all associated data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business deleted successfully
 *       404:
 *         description: Business not found
 */
router.delete('/businesses/:businessId', deleteBusiness);

/**
 * @swagger
 * /api/admin/businesses/{businessId}/users:
 *   post:
 *     summary: Create a business user (employee)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Business user created
 */
router.post('/businesses/:businessId/users', validateBody(createUserSchema), createBusinessUser);

/**
 * @swagger
 * /api/admin/businesses/{businessId}/users:
 *   get:
 *     summary: List business users (employees)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of business users
 */
router.get('/businesses/:businessId/users', listBusinessUsers);

/**
 * @swagger
 * /api/admin/businesses/{businessId}/users/{userId}:
 *   put:
 *     summary: Update business user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business user updated
 */
router.put('/businesses/:businessId/users/:userId', validateBody(updateUserSchema), updateBusinessUser);

/**
 * @swagger
 * /api/admin/businesses/{businessId}/users/{userId}:
 *   delete:
 *     summary: Delete business user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business user deleted
 */
router.delete('/businesses/:businessId/users/:userId', deleteBusinessUser);

/**
 * @swagger
 * /api/admin/businesses/{businessId}/clients:
 *   post:
 *     summary: Create a client for a business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               initialPoints:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Client created with QR code
 */
router.post('/businesses/:businessId/clients', validateBody(createClientSchema), createClient);

/**
 * @swagger
 * /api/admin/businesses/{businessId}/clients/generate:
 *   post:
 *     summary: Bulk generate clients for a business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
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
 *               - count
 *             properties:
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of clients to generate
 *     responses:
 *       201:
 *         description: Clients generated successfully
 */
router.post('/businesses/:businessId/clients/generate', generateClients);

/**
 * @swagger
 * /api/admin/businesses/{businessId}/clients:
 *   get:
 *     summary: List clients for a business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: List of clients
 */
router.get('/businesses/:businessId/clients', validateQuery(searchClientSchema), listClients);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: View platform-wide transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessId
 *         schema:
 *           type: string
 *       - in: query
 *         name: clientId
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

export default router;
