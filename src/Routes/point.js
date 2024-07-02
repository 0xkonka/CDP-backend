import express from 'express'
import bodyParser from 'body-parser'
import {
  distributeOffChainPoint,
  getUserOffChainPoint,
  addMultiplierPermanent,
  addMultiplierTemporary,
  getOnChainPointList,
  getOffChainPointList,
  getUserOnChainPoint,
} from '../controller/point.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const pointRoute = express.Router()

pointRoute.use(bodyParser.json()) // to use body object in requests

/**
 * @swagger
 * /api/point/admin/distributeOffChainPoint:
 *   post:
 *     summary: Distribute experience points
 *     tags: [Point-Admin]
 *     description: Distributes XP to a specific user account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: The account identifier to which XP will be distributed.
 *               xpPoint:
 *                 type: number
 *                 description: The amount of experience points to distribute.
 *     responses:
 *       200:
 *         description: XP distributed successfully.
 *       400:
 *         description: Bad request, missing account or invalid parameters.
 *       500:
 *         description: Internal server error.
 */
pointRoute.post('/admin/distributeOffChainPoint', verifyToken('admin'), distributeOffChainPoint)

/**
 * @swagger
 * /api/point/admin/addMultiplierPermanent:
 *   post:
 *     summary: Set the permanent multiplier for experience points
 *     tags: [Point-Admin]
 *     description: Sets a multiplier for experience points for a specific account, this multiplier is endless
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: The account identifier.
 *               multiplier:
 *                 type: number
 *                 description: Multiplier value to set.
 *     responses:
 *       200:
 *         description: Permanent Multiplier set successfully.
 *       400:
 *         description: Bad request, missing account or invalid parameters.
 *       500:
 *         description: Internal server error.
 */
pointRoute.post('/admin/addMultiplierPermanent', verifyToken('admin'), addMultiplierPermanent)

/**
 * @swagger
 * /api/point/admin/addMultiplierTemporary:
 *   post:
 *     summary: Set the temporary multiplier for experience points
 *     tags: [Point-Admin]
 *     description: Sets a multiplier for experience points for a specific account, applicable until a specified end time. ** period unit is DAY **
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: The account identifier.
 *               multiplier:
 *                 type: number
 *                 description: Multiplier value to set.
 *               period:
 *                 type: number
 *                 descripton: multiplier duration time, unit is day. if 0 -> endless
 *     responses:
 *       200:
 *         description: Temporary Multiplier set successfully.
 *       400:
 *         description: Bad request, missing account or invalid parameters.
 *       500:
 *         description: Internal server error.
 */
pointRoute.post('/admin/addMultiplierTemporary', verifyToken('admin'), addMultiplierTemporary)

/**
 * @swagger
 * /api/point/onChain/list:
 *   post:
 *     summary: Get onchain points for all user
 *     tags: [Point-User]
 *     description: Retrieves all user onchain points
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: number
 *                 description: period 
 *     responses:
 *       200:
 *         description: Points information retrieved successfully.
 *       404:
 *         description: Account not found.
 *       500:
 *         description: Internal server error.
 */
pointRoute.post('/onChain/list', getOnChainPointList)

/**
 * @swagger
 * /api/point/offChain/list:
 *   get:
 *     summary: Get offchain points for all user
 *     tags: [Point-User]
 *     description: Retrieves all user offchain points
 *     responses:
 *       200:
 *         description: Points information retrieved successfully.
 *       404:
 *         description: Account not found.
 *       500:
 *         description: Internal server error.
 */
pointRoute.get('/offChain/list', getOffChainPointList)

/**
 * @swagger
 * /api/point/onChain/user:
 *   post:
 *     summary: Get onchain points for a user
 *     tags: [Point-User]
 *     description: Retrieves onchain points and ranking information for a specific user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: account
 *               period:
 *                 type: number
 *                 description: period 
 *     responses:
 *       200:
 *         description: Points information retrieved successfully.
 *       404:
 *         description: Account not found.
 *       500:
 *         description: Internal server error.
 */
pointRoute.post('/onChain/user', getUserOnChainPoint)

/**
 * @swagger
 * /api/point/offChain/user/{account}:
 *   get:
 *     summary: Get offchain points for a user
 *     tags: [Point-User]
 *     description: Retrieves offchain points and ranking information for a specific user.
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: User account identifier.
 *     responses:
 *       200:
 *         description: Points information retrieved successfully.
 *       404:
 *         description: Account not found.
 *       500:
 *         description: Internal server error.
 */
pointRoute.get('/offChain/user/:account', getUserOffChainPoint)

export default pointRoute
