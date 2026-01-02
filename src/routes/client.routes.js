import { Router } from 'express';
import { getDashboard, getQR, activateClient } from '../controllers/client.controller.js';
import { publicLimiter } from '../middlewares/index.js';

const router = Router();

// Public routes with rate limiting
router.use(publicLimiter);

/**
 * @swagger
 * /api/client/{businessSlug}/{clientId}:
 *   get:
 *     summary: Get client dashboard
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: businessSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique slug for the business
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique client ID (e.g., CAFE-X7F4P2)
 *     responses:
 *       200:
 *         description: Client dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 client:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     points:
 *                       type: integer
 *                 business:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     category:
 *                       type: string
 *                 availableRewards:
 *                   type: array
 *                   items:
 *                     type: object
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Client not found
 */
router.get('/:businessSlug/:clientId', getDashboard);

/**
 * @swagger
 * /api/client/{businessSlug}/{clientId}/activate:
 *   post:
 *     summary: Activate client card
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: businessSlug
 *         required: true
 *         schema:
 *           type: string
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
 *               - name
 *               - activationCode
 *             properties:
 *               name:
 *                 type: string
 *               activationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Card activated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Invalid activation code
 */
router.post('/:businessSlug/:clientId/activate', activateClient);

/**
 * @swagger
 * /api/client/{clientId}/qr:
 *   get:
 *     summary: Get QR code for client
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique client ID
 *     responses:
 *       200:
 *         description: QR code data URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 clientId:
 *                   type: string
 *                 qrDataUrl:
 *                   type: string
 *       404:
 *         description: Client not found
 */
router.get('/:businessSlug/:clientId/qr', getQR);

export default router;
