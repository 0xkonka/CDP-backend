import express from "express";
import bodyParser from "body-parser";
import { generateToken } from '../controller/auth.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import pointRoute from "./point.js";
import referralRoute from "./referral.js";

const app = express.Router()

app.use(bodyParser.json()) // to use body object in requests

// app.get('/api/admin/generatetoken', generateToken)

app.use('/', referralRoute)
app.use('/', pointRoute)

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
 *         multiplier_permanent:
 *           type: number
 *           description: permanent multiplier
 *         multiplier_temporary:
 *           type: number
 *           description: temporary multiplier for given period
 *         endTimestamp:
 *           type: number
 *           descripton: multiplier duration til time, if 0 -> endless
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
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default app;
