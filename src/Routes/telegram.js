import express from 'express'
import bodyParser from 'body-parser'
import {
  startFarmingPoint,
  getUserStatus,
  addWalletToTelegram,
  updateSocialTaskStatus,
  createUserId,
  registerUser,
  getAppStatus,
} from '../controller/telegram.js'
import { validateRealIp } from '../middleware/validateRealIp.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const telegramRoute = express.Router()

telegramRoute.use(bodyParser.json())

// telegramRoute.use(validateRealIp);

/**
 * @swagger
 * /api/telegram/user/create:
 *   post:
 *     summary: Create a new user with a unique userId
 *     tags: [Telegram]
 *     description: Create a new user with a unique userId.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Unique userId for the new user
 *               referrerId:
 *                 type: string
 *                 description: referrer ID 
 *     responses:
 *       200:
 *         description: User created successfully.
 *       400:
 *         description: Bad request, missing userId.
 *       409:
 *         description: Conflict, userId already exists.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.post('/user/create', verifyToken('telegram'), createUserId)

/**
 * @swagger
 * /api/telegram/user/register:
 *   post:
 *     summary: Register a new user with a unique userId
 *     tags: [Telegram]
 *     description: Register a new user with a unique userId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Unique userId for the new user
 *               userName:
 *                 type: string
 *                 description: Telegram Username
 *     responses:
 *       200:
 *         description: User registered successfully.
 *       400:
 *         description: Bad request, missing userId.
 *       409:
 *         description: Conflict, userId already exists.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.post('/user/register', registerUser)

/**
 * @swagger
 * /api/telegram/farm/start:
 *   post:
 *     summary: Start Farming XP Points
 *     tags: [Telegram]
 *     description: Start farming XP points for a Telegram user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Telegram user ID to start farming XP
 *     responses:
 *       200:
 *         description: XP farming started successfully.
 *       400:
 *         description: Bad request, missing account or invalid parameters.
 *       409:
 *         description: Conflict, 24 hours have not passed since the last farming start.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.post('/farm/start', startFarmingPoint)

/**
 * @swagger
 * /api/telegram/status:
 *   get:
 *     summary: Get Telegram Status
 *     tags: [Telegram]
 *     description: Retrieve Telegram status
 *     responses:
 *       200:
 *         description: Telegram App status retrieved successfully.
 *       400:
 *         description: Bad request, missing userId.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.get('/status/', getAppStatus)

/**
 * @swagger
 * /api/telegram/status/{userId}:
 *   get:
 *     summary: Get User Telegram Status
 *     tags: [Telegram]
 *     description: Retrieve Telegram status for a specific user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Telegram user ID.
 *     responses:
 *       200:
 *         description: User status retrieved successfully.
 *       400:
 *         description: Bad request, missing userId.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.get('/status/:userId', getUserStatus)

/**
 * @swagger
 * /api/telegram/account/add:
 *   post:
 *     summary: Add Wallet to Telegram Account
 *     tags: [Telegram]
 *     description: Add a wallet address to a Telegram account for farming XP points.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Telegram user ID
 *               account:
 *                 type: string
 *                 description: Wallet address to be added
 *     responses:
 *       200:
 *         description: Wallet added successfully.
 *       400:
 *         description: Bad request, missing account or invalid parameters.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.post('/account/add', addWalletToTelegram)

/**
 * @swagger
 * /api/telegram/social/update:
 *   post:
 *     summary: Update Social Task Status
 *     tags: [Telegram]
 *     description: Update the status of social tasks for a Telegram user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Telegram user ID
 *               social:
 *                 type: string
 *                 description: Social task to update (telegram, discord, twitter)
 *     responses:
 *       200:
 *         description: Social task status updated successfully.
 *       400:
 *         description: Bad request, missing account or invalid parameters.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.post('/social/update', updateSocialTaskStatus)


export default telegramRoute
