import express from "express";
import bodyParser from "body-parser";
import { distributeXP, getUserPoint, addMultiplierPermanent, addMultiplierTemporary, getPointsList } from '../controller/point.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const pointRoute = express.Router()

pointRoute.use(bodyParser.json()) // to use body object in requests

/**
 * @swagger
 * /api/point/admin/distributeXP:
 *   post:
 *     summary: Distribute experience points
 *     tags: [Admin]
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
pointRoute.post('/point/admin/distributeXP', verifyToken, distributeXP)

/**
 * @swagger
 * /api/point/admin/addMultiplierPermanent:
 *   post:
 *     summary: Set the permanent multiplier for experience points
 *     tags: [Admin]
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
pointRoute.post('/point/admin/addMultiplierPermanent', verifyToken, addMultiplierPermanent)

/**
 * @swagger
 * /api/point/admin/addMultiplierTemporary:
 *   post:
 *     summary: Set the temporary multiplier for experience points
 *     tags: [Admin]
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
pointRoute.post('/point/admin/addMultiplierTemporary', verifyToken, addMultiplierTemporary)

/**
 * @swagger
 * /api/point/list:
 *   get:
 *     summary: Get points for all user
 *     tags: [User]
 *     description: Retrieves all user points
 *     responses:
 *       200:
 *         description: Points information retrieved successfully.
 *       404:
 *         description: Account not found.
 *       500:
 *         description: Internal server error.
 */
pointRoute.get('/point/list', getPointsList)

/**
 * @swagger
 * /api/point/user/{account}:
 *   get:
 *     summary: Get points for a user
 *     tags: [User]
 *     description: Retrieves points and ranking information for a specific user.
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
pointRoute.get('/point/user/:account', getUserPoint)

export default pointRoute;
