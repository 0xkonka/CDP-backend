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
import { Point } from '../models/Point'

export const distributeXP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account, xpPoint = 0 } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account' })
    }

    const existingPoint = await Point.findOne({ account })

    const newXPPoint = existingPoint ? existingPoint.xpPoint + xpPoint : xpPoint

    await Point.findOneAndUpdate({ account }, { xpPoint: newXPPoint }, { new: true, upsert: true })

    return res.status(SUCCESS_CODE).send({ result: true, data: newXPPoint })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const setMultiplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { account, multiplier, endTimestamp } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid account' })
    }

    if (endTimestamp > 0 && endTimestamp < Math.floor(Date.now() / 1000))
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'timestamp should be bigger than current time' })

    if (!multiplier && multiplier < 1) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid multiplier' })
    }

    await Point.findOneAndUpdate({ account }, { multiplier, endTimestamp }, { new: true, upsert: true })

    return res.status(SUCCESS_CODE).send({ result: true })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getUserPoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = req.params.account

    console.log('account', account)

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    const point = await Point.findOne({ account })

    const rank = await Point.aggregate([
      {
        $sort: { xpPoint: -1 }, // Sort documents by xpPoint in descending order
      },
      {
        $setWindowFields: {
          sortBy: { xpPoint: -1 },
          output: {
            rank: {
              $rank: {},
            },
          },
        },
      },
      {
        $match: { account },
      },
    ])
    return res.status(SUCCESS_CODE).send({ result: true, data: { point, rank: rank.length >= 1 && rank[0].rank } })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}
