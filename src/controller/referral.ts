import { Request, Response } from 'express'
import { NOT_FOUND_CODE, NOT_FOUND_MSG, SERVER_ERROR_CODE, SERVER_ERROR_MSG, SUCCESS_CODE } from '../utils/response'
import { Referral } from '../models/Referral'
import { generateRandomCode } from '../utils'

export const generateInviteCode = async (req: Request, res: Response) => {
  try {
    console.log('req.query', req.query)
    const count = req.query.count || 1

    for (let i = 0; i < +count; i++) {
      const inviteCode = generateRandomCode()

      const result = await Referral.create({ owner: 'admin', inviteCode })
      console.log('result', result)
    }

    return res.status(SUCCESS_CODE).send({ result: true })
  } catch (error) {
    console.log('error', error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const redeemInviteCode = async (req: Request, res: Response) => {
  try {
    console.log('req.query', req.query)
    const { account, inviteCode, count } = req.query

    if (!account || !inviteCode || !count) {
      return res.status(400).json({ result: false, message: 'Missing account or inviteCode or count' })
    }

    const referral = await Referral.findOne({ inviteCode })

    if (!referral) return res.status(NOT_FOUND_CODE).send({ result: false, messages: NOT_FOUND_MSG })

    await Referral.updateOne({ inviteCode }, { $set: { redeemer: account, redeemed: true } })

    for (let i = 0; i < +count; i++)
      await Referral.updateOne({ owner: 'admin', redeemed: false }, { $set: { owner: account } })

    return res.status(SUCCESS_CODE).send({ result: true })
  } catch (error) {
    console.log('error', error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getInviteCodes = async (req: Request, res: Response) => {
  try {
    const account = req.params.account

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    const data = await Referral.find({ owner: account })

    return res.status(SUCCESS_CODE).send({ result: true, data })
  } catch (error) {
    console.log('error', error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}
