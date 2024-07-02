import express from 'express'
import bodyParser from 'body-parser'
import {
  startFarmingPoint,
  getUserStatus,
  addWalletToTelegram,
  updateSocialTaskStatus,
  createUserId,
  addReferrer,
} from '../controller/telegram.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const telegramRoute = express.Router()

telegramRoute.use(bodyParser.json())

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
 * /api/telegram/farm/start:
 *   post:
 *     summary: Start Farming XP Points
 *     tags: [Telegram]
 *     description: Start farming XP points for a Telegram user.
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
telegramRoute.post('/farm/start', verifyToken('telegram'), startFarmingPoint)

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
telegramRoute.post('/account/add', verifyToken('telegram'), addWalletToTelegram)

/**
 * @swagger
 * /api/telegram/social/update:
 *   post:
 *     summary: Update Social Task Status
 *     tags: [Telegram]
 *     description: Update the status of social tasks for a Telegram user.
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
 *                 description: Telegram user ID
 *               social:
 *                 type: string
 *                 description: Social task to update (telegram, discord, twitter)
 *               status:
 *                 type: boolean
 *                 description: Status of the social task
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
telegramRoute.post('/social/update', verifyToken('telegram'), updateSocialTaskStatus)

/**
 * @swagger
 * /api/telegram/referrer/add:
 *   post:
 *     summary: Add Referrer to Telegram User
 *     tags: [Telegram]
 *     description: Add a referrer to a Telegram user.
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
 *                 description: Telegram user ID
 *               referrer:
 *                 type: string
 *                 description: Referrer ID to be added
 *     responses:
 *       200:
 *         description: Referrer added successfully.
 *       400:
 *         description: Bad request, missing userId or referrer.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
telegramRoute.post('/referrer/add', verifyToken('telegram'), addReferrer)

export default telegramRoute
