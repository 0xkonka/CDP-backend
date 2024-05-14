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
} from '../utils/response.js'
import { Point } from '../models/Point.js'

export const distributeXP = async (req, res, next) => {
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

export const setMultiplierPermanent = async (req, res, next) => {
  try {
    const { account, multiplier } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid account' })
    }

    if (!multiplier && multiplier < 1) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid multiplier' })
    }

    const point = await Point.findOneAndUpdate(
      { account },
      { multiplier_permanent: multiplier },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true, data: point })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const setMultiplierTemporary = async (req, res, next) => {
  try {
    const { account, multiplier, period = 1 } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid account' })
    }

    // if (endTimestamp > 0 && endTimestamp < Math.floor(Date.now() / 1000))
    //   return res.status(BAD_REQ_CODE).json({ result: false, message: 'timestamp should be bigger than current time' })

    if (!multiplier) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid multiplier' })
    }

    const point = await Point.findOneAndUpdate(
      { account },
      { multiplier_temporary: multiplier, endTimestamp: Math.floor(Date.now() / 1000) + period * 24 * 3600 },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true, data: point })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getUserPoint = async (req, res, next) => {
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
