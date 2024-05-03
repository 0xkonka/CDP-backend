import { NextFunction, Request, Response } from 'express'
import {
  BAD_REQ_CODE,
  CONFLICT_CODE,
  FORBIDDEN_CODE,
  FORBIDDEN_MSG,
  NOT_FOUND_CODE,
  NOT_FOUND_MSG,
  SERVER_ERROR_CODE,
  SERVER_ERROR_MSG,
  SUCCESS_CODE,
} from '../utils/response'
import { Referral } from '../models/Referral'
import { generateRandomCode } from '../utils'
import { Point } from '../models/Point'

export const generateInviteCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = req.body.count || 1

    for (let i = 0; i < +count; i++) {
      const inviteCode = generateRandomCode()

      const result = await Referral.create({ owner: 'admin', inviteCode })
    }

    return res.status(SUCCESS_CODE).send({ result: true })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const validateInviteCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('req.body', req.body)
    const { inviteCode } = req.body

    if (!inviteCode) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing inviteCode' })
    }

    const referral = await Referral.findOne({ inviteCode })

    if (!referral) return res.status(NOT_FOUND_CODE).send({ result: false, messages: 'InviteCode Not Found' })

    if (referral.redeemed == true)
      return res.status(CONFLICT_CODE).send({ result: false, messages: 'This InviteCode is already redeemed' })

    return res.status(SUCCESS_CODE).send({ result: true, data: referral })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const redeemInviteCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account, inviteCode, count } = req.body

    if (!account || !inviteCode || !count) {
      return res.status(400).json({ result: false, message: 'Missing account or inviteCode or count' })
    }

    const isAlreadyRedeemed = await Referral.findOne({ redeemer: account })
    if (isAlreadyRedeemed) return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })

    const referral = await Referral.findOne({ inviteCode })
    if (!referral) return res.status(NOT_FOUND_CODE).send({ result: false, messages: NOT_FOUND_MSG })

    await Referral.updateOne({ inviteCode }, { $set: { redeemer: account, redeemed: true } })

    for (let i = 0; i < +count; i++)
      await Referral.updateOne({ owner: 'admin', redeemed: false }, { $set: { owner: account } })

    return res.status(SUCCESS_CODE).send({ result: true })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getUserReferral = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = req.params.account

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    const isRedeemed = await Referral.findOne({ redeemer: account })

    if (isRedeemed) {
      let referral = await Referral.find({ owner: account })
      for (let i = 0; i < referral.length; i++) {
        const redeemerPoint = await Point.findOne({ account: referral[i].redeemer })
        if (redeemerPoint) referral[i] = { ...referral[i].toObject(), xpPoint: redeemerPoint.xpPoint }
      }
      const userPoint = await Point.findOne({ account })
      return res.status(SUCCESS_CODE).send({ result: true, redeemed: true, data: { referral, point: userPoint } })
    }
    return res.status(SUCCESS_CODE).send({ result: true, redeemed: false })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}
