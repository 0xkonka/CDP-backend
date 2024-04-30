import { Request, Response } from 'express'
import { SERVER_ERROR_CODE, SERVER_ERROR_MSG, SUCCESS_CODE } from '../utils/response'
import { Referral } from '../models/Referral'
import { generateRandomCode } from '../utils'

export const generateInviteCode = async (req: Request, res: Response) => {
  try {
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
