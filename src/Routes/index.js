import express from "express";
import bodyParser from "body-parser";
import { generateToken } from '../controller/auth.js'
import pointRoute from "./point.js";
import referralRoute from "./referral.js";
import telegramRoute from "./telegram.js";

const app = express.Router()

app.use(bodyParser.json()) // to use body object in requests

app.use('/referral', referralRoute)
app.use('/point', pointRoute)
app.use('/telegram', telegramRoute)

// /**
//  * @swagger
//  * /api/auth/generateToken:
//  *   post:
//  *     summary: Generate a token for admin or telegram app
//  *     tags: [Auth]
//  *     description: Generate a token with a specified role (admin or telegram)
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               secret:
//  *                 type: string
//  *                 description: Secret key for generating the token
//  *               role:
//  *                 type: string
//  *                 description: Role for the token (admin or telegram)
//  *     responses:
//  *       200:
//  *         description: Token generated successfully
//  *       400:
//  *         description: Bad request, missing secret or role, or invalid role
//  *       500:
//  *         description: Internal server error
//  */
// app.post('/auth/generateToken', generateToken)

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
 *           description: Owner of the invite code
 *         inviteCode:
 *           type: string
 *           description: Invite code
 *         redeemer:
 *           type: string
 *           description: User who redeemed the invite code
 *         redeemed:
 *           type: boolean
 *           description: Whether the invite code has been redeemed or not
 *         signMsg:
 *           type: string
 *           description: Sign message
 *       example:
 *         owner: 0xf812844A1f3187F6e31336d3684FAd2dD31219E3
 *         inviteCode: F7N6C
 *         redeemer: 0x8398f002122DcD0EcfDBB0725Af7637D4C8fF1b1
 *         redeemed: true
 *         signMsg: exampleSignMessage
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
 *           description: User wallet address
 *         xpPoint:
 *           type: number
 *           description: XP points
 *         multiplier_permanent:
 *           type: number
 *           description: Permanent multiplier
 *         multiplier_temporary:
 *           type: number
 *           description: Temporary multiplier for a given period
 *         endTimestamp:
 *           type: number
 *           description: Multiplier duration until this time, if 0 then endless
 *       example:
 *         account: 0x8398f002122DcD0EcfDBB0725Af7637D4C8fF1b1
 *         xpPoint: 14000
 *         multiplier_permanent: 2
 *         multiplier_temporary: 1.1
 *         endTimestamp: 1
 *
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Telegram:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           description: Telegram user ID
 *         account:
 *           type: string
 *           description: Wallet address
 *         farmStartingTime:
 *           type: number
 *           description: The starting time of farming
 *           default: 0
 *         socialTaskStatus:
 *           type: object
 *           properties:
 *             telegram:
 *               type: boolean
 *               description: Status of the Telegram task
 *               default: false
 *             discord:
 *               type: boolean
 *               description: Status of the Discord task
 *               default: false
 *             twitter:
 *               type: boolean
 *               description: Status of the Twitter task
 *               default: false
 *       example:
 *         userId: '123456789'
 *         account: '0x8398f002122DcD0EcfDBB0725Af7637D4C8fF1b1'
 *         farmStartingTime: 1627873200
 *         socialTaskStatus:
 *           telegram: true
 *           discord: false
 *           twitter: true
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

export default app;
