import express from "express";
import bodyParser from "body-parser";
import { generateToken } from '../controller/auth.js'
import { distributeXP, getUserPoint, setMultiplier } from '../controller/point.js'
import { getUserReferral, redeemInviteCode, validateInviteCode, generateInviteCode, distributeInviteCode, getAvalableInviteCodes } from '../controller/referral.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const app = express.Router()

app.use(bodyParser.json()) // to use body object in requests

// app.get('/api/admin/generatetoken', generateToken)

/**
 * @swagger
 * components:
 *   schemas:
 *     Referral:
 *       type: object
 *       required:
 *         - owner
 *         - inviteCode
 *       properties:
 *         owner:
 *           type: string
 *           description: owner of inviteCode
 *         inviteCode:
 *           type: string
 *           description: inviteCode
 *         redeemer:
 *           type: number
 *           description: user who redeemed inviteCode
 *         redeemed:
 *           type: boolean
 *           descripton: redeemed or not
 *         signMsg:
 *           type: string
 *           descripton: sign Msg
 *       example:
 *         account: 0xf812844A1f3187F6e31336d3684FAd2dD31219E3
 *         inviteCode: F7N6C
 *         redeemer: 0x8398f002122DcD0EcfDBB0725Af7637D4C8fF1b1
 *         redeemed: true
 *         signMsg: 
 *
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Point:
 *       type: object
 *       required:
 *         - account
 *       properties:
 *         account:
 *           type: string
 *           description: user wallet address
 *         xpPoint:
 *           type: number
 *           description: xpPoint
 *         multiplier:
 *           type: number
 *           description: multiplier
 *         endTimestamp:
 *           type: number
 *           descripton: multiplier duration til time, if 0 -> endless
 *       example:
 *         account: 0x8398f002122DcD0EcfDBB0725Af7637D4C8fF1b1
 *         xpPoint: 14000
 *         multiplier: 1.8
 *         endTimestamp: 0
 *
 */

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
 * /api/referral/admin/avalableInviteCodes:
 *   post:
 *     summary: Get available InviteCode list
 *     tags: [Admin]
 *     description: Get available InviteCode list
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available InviteCode retrieved successfully.
 *       500:
 *         description: Internal server error.
 */
app.get('/referral/admin/avalableInviteCodes', verifyToken, getAvalableInviteCodes)

/**
 * @swagger
 * /api/referral/admin/generate:
 *   post:
 *     summary: Generate an invite code
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
 * /api/referral/admin/distributeCodes:
 *   post:
 *     summary: Distribute invite Code to user
 *     tags: [Admin]
 *     description: Distribute invite Codes to user
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
 *                 description: The account identifier to which inviteCodes will be distributed.
 *               count:
 *                 type: number
 *                 description: Number of invite codes to generate.
 *     responses:
 *       200:
 *         description: Invite code(s) generated successfully.
 *       500:
 *         description: Internal server error.
 */
app.post('/referral/admin/distributeCodes', verifyToken, distributeInviteCode)

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
app.post('/point/admin/distributeXP', verifyToken, distributeXP)

/**
 * @swagger
 * /api/point/admin/setMultiplier:
 *   post:
 *     summary: Set the multiplier for experience points
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
 *               period:
 *                 type: number
 *                 descripton: multiplier duration time, unit is day. if 0 -> endless
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
 * /api/referral/user/validate:
 *   post:
 *     summary: Validate an invite code
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
 * /api/referral/user/redeem:
 *   post:
 *     summary: Redeem an invite code
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
 * /api/referral/user/{account}:
 *   get:
 *     summary: Get referral information for a user
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
app.get('/point/user/:account', getUserPoint)

export default app;
