import express from "express";
import bodyParser from "body-parser";
import { generateToken } from '../controller/auth.js'
import { distributeXP, getUserPoint, setMultiplier } from '../controller/point.js'
import { getUserReferral, redeemInviteCode, validateInviteCode, generateInviteCode } from '../controller/referral.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const app = express.Router()

app.use(bodyParser.json()) // to use body object in requests

// app.get('/api/admin/generatetoken', generateToken)

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 *   post:
 *     summary: /api/referral/admin/generate - Generate an invite code 
 *     tags: [Admin]
 *     description: Generate a new invite code for use in referral promotions.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: number
 *                 description: Number of invite codes to generate.
 *     responses:
 *       200:
 *         description: Invite code(s) generated successfully.
 *       500:
 *         description: Internal server error.
 */
app.post('/referral/admin/generate', verifyToken, generateInviteCode)

/**
 * @swagger
 *   post:
 *     summary: /api/point/admin/distributeXP - Distribute experience points
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
app.post('/point/admin/distributeXP', verifyToken, distributeXP)

/**
 * @swagger
 *   post:
 *     summary: /api/point/admin/setMultiplier - Set the multiplier for experience points
 *     tags: [Admin]
 *     description: Sets a multiplier for experience points for a specific account, applicable until a specified end time.
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
 *               endTimestamp:
 *                 type: number
 *                 description: Timestamp when the multiplier expires.
 *     responses:
 *       200:
 *         description: Multiplier set successfully.
 *       400:
 *         description: Bad request, missing account or invalid parameters.
 *       500:
 *         description: Internal server error.
 */
app.post('/point/admin/setMultiplier', verifyToken, setMultiplier)

/**
 * @swagger
 *   post:
 *     summary: /api/referral/user/validate - Validate an invite code
 *     tags: [User]
 *     description: Validates if an invite code is correct and not yet redeemed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 description: The invite code to validate.
 *     responses:
 *       200:
 *         description: Invite code is valid.
 *       400:
 *         description: Missing invite code or other bad input.
 *       404:
 *         description: Invite code not found.
 *       409:
 *         description: Invite code already redeemed.
 *       500:
 *         description: Internal server error.
 */
app.post('/referral/user/validate', validateInviteCode)

/**
 * @swagger
 *   post:
 *     summary: /api/referral/user/redeem - Redeem an invite code
 *     tags: [User]
 *     description: Redeems an invite code to associate it with the user's account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: The user account that is redeeming the invite code.
 *               inviteCode:
 *                 type: string
 *                 description: The invite code to redeem.
 *               count:
 *                 type: number
 *                 description: Number of invite codes to distribute.
 *     responses:
 *       200:
 *         description: Invite code redeemed successfully.
 *       400:
 *         description: Missing account or invite code.
 *       404:
 *         description: Invite code not found.
 *       409:
 *         description: Invite code already redeemed or account has redeemed another code.
 *       500:
 *         description: Internal server error.
 */
app.post('/referral/user/redeem', redeemInviteCode)

/**
 * @swagger
 *   get:
 *     summary: /api/referral/user/{account} - Get referral information for a user
 *     tags: [User]
 *     description: Retrieves referral status and details for a specific user.
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: User account identifier.
 *     responses:
 *       200:
 *         description: Referral information retrieved successfully.
 *       404:
 *         description: Account not found.
 *       500:
 *         description: Internal server error.
 */
app.get('/referral/user/:account', getUserReferral)

/**
 * @swagger
 *   get:
 *     summary: /api/point/user/{account} - Get points for a user
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
app.get('/point/user/:account', getUserPoint)

export default app;
