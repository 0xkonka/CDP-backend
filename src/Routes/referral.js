import express from 'express'
import bodyParser from 'body-parser'
import {
  getUserReferral,
  redeemInviteCode,
  validateInviteCode,
  generateInviteCode,
  distributeInviteCode,
  adminRedeemInviteCode,
  // getUserReferrer,
  getInviteCodeStatus,
  getAvailableInviteCodes,
} from '../controller/referral.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware.js'

const referralRoute = express.Router()

referralRoute.use(bodyParser.json()) // to use body object in requests

/**
 * @swagger
 * /api/referral/admin/availableInviteCodes:
 *   post:
 *     summary: Get available InviteCode list
 *     tags: [Referral-Admin]
 *     description: Get available InviteCode list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteCodeType:
 *                 type: string
 *                 description: The type of invite code (default is 'testnet').
 *                 example: 'testnet'
 *     responses:
 *       200:
 *         description: Available InviteCode retrieved successfully.
 *       500:
 *         description: Internal server error.
 */
referralRoute.post('/admin/availableInviteCodes', verifyToken('admin'), getAvailableInviteCodes)

/**
 * @swagger
 * /api/referral/admin/generate:
 *   post:
 *     summary: Generate an invite code
 *     tags: [Referral-Admin]
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
 *               inviteCodeType:
 *                 type: string
 *                 description: The type of invite code (default is 'testnet').
 *                 example: 'testnet'
 *     responses:
 *       200:
 *         description: Invite code(s) generated successfully.
 *       500:
 *         description: Internal server error.
 */
referralRoute.post('/admin/generate', verifyToken('admin'), generateInviteCode)

/**
 * @swagger
 * /api/referral/admin/distributeCodes:
 *   post:
 *     summary: Distribute invite Code to user
 *     tags: [Referral-Admin]
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
 *               inviteCodeType:
 *                 type: string
 *                 description: The type of invite code (default is 'testnet').
 *                 example: 'testnet'
 *     responses:
 *       200:
 *         description: Invite code(s) generated successfully.
 *       500:
 *         description: Internal server error.
 */
referralRoute.post('/admin/distributeCodes', verifyToken('admin'), distributeInviteCode)

/**
 * @swagger
 * /api/referral/admin/redeem:
 *   post:
 *     summary: Redeem an invite code
 *     tags: [Referral-Admin]
 *     description: Redeems an invite code to associate it with the user's account.
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
 *                 description: The user account that is redeeming the invite code.
 *               count:
 *                 type: number
 *                 description: Number of invite codes to distribute.
 *               inviteCodeType:
 *                 type: string
 *                 description: The type of invite code (default is 'testnet').
 *                 example: 'testnet'
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
referralRoute.post('/admin/redeem', verifyToken('admin'), adminRedeemInviteCode)

/**
 * @swagger
 * /api/referral/user/inviteCodeStatus:
 *   get:
 *     summary: Get total redeemed inviteCodes and available inviteCodes
 *     tags: [Referral-User]
 *     description: Get total redeemed inviteCodes and available inviteCodes
 *     parameters:
 *       - in: query
 *         name: inviteCodeType
 *         schema:
 *           type: string
 *           default: 'testnet'
 *         description: The type of invite code (default is 'testnet').
 *     responses:
 *       200:
 *         description: InviteCode status retrieved successfully.
 *       500:
 *         description: Internal server error.
 */
referralRoute.get('/user/inviteCodeStatus', getInviteCodeStatus)

/**
 * @swagger
 * /api/referral/user/validate:
 *   post:
 *     summary: Validate an invite code
 *     tags: [Referral-User]
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
 *               inviteCodeType:
 *                 type: string
 *                 description: The type of invite code (default is 'testnet').
 *                 example: 'testnet'
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
referralRoute.post('/user/validate', validateInviteCode)

/**
 * @swagger
 * /api/referral/user/redeem:
 *   post:
 *     summary: Redeem an invite code
 *     tags: [Referral-User]
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
 *               inviteCodeType:
 *                 type: string
 *                 description: The type of invite code (default is 'testnet').
 *                 example: 'testnet'
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
referralRoute.post('/user/redeem', rateLimitMiddleware, redeemInviteCode)

/**
 * @swagger
 * /api/referral/user/{account}:
 *   get:
 *     summary: Get referral information for a user
 *     tags: [Referral-User]
 *     description: Retrieves referral status and details for a specific user.
 *     parameters:
 *       - in: path
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: User account identifier.
 *       - in: query
 *         name: inviteCodeType
 *         schema:
 *           type: string
 *           default: 'testnet'
 *         description: The type of invite code (default is 'testnet').
 *     responses:
 *       200:
 *         description: Referral information retrieved successfully.
 *       404:
 *         description: Account not found.
 *       500:
 *         description: Internal server error.
 */
referralRoute.get('/user/:account', getUserReferral)

// /**
//  * @swagger
//  * /api/referral/getReferrer/{account}:
//  *   get:
//  *     summary: Get referrer of user
//  *     tags: [Referral-User]
//  *     description: Retrieves referrer details for a specific user.
//  *     parameters:
//  *       - in: path
//  *         name: account
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: User account identifier.
//  *       - in: query
//  *         name: inviteCodeType
//  *         schema:
//  *           type: string
//  *           default: 'testnet'
//  *         description: The type of invite code (default is 'testnet').
//  *     responses:
//  *       200:
//  *         description: Referrer information retrieved successfully.
//  *       404:
//  *         description: Account not found.
//  *       500:
//  *         description: Internal server error.
//  */
// referralRoute.get('/getReferrer/:account', getUserReferrer)

export default referralRoute
