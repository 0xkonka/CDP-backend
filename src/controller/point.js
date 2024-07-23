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
import fetch from 'node-fetch'
import { updateTreningPoints } from '../contractCall/pointKeeper.js'
import { Referral } from '../models/Referral.js'

export const distributeOffChainPoint = async (req, res, next) => {
  try {
    const { account, xpPoint = 0 } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account' })
    }

    const existingPoint = await Point.findOne({ account })

    const referrer = (await Referral.findOne({ redeemer: account })).owner

    const newXPPoint = existingPoint ? existingPoint.xpPoint + xpPoint * 0.85 : xpPoint * 0.85

    const updatedUser = await Point.findOneAndUpdate(
      { account },
      { $addToSet: { xpPoint: { point: xpPoint * 0.85, timestamp: Math.floor(Date.now() / 1000) } } },
      // { $inc: { xpPoint: xpPoint * 0.85 } },
      // { xpPoint: newXPPoint },
      { new: true, upsert: true }
    )
    const updatedReferrer = await Point.findOneAndUpdate(
      { account: referrer },
      { $addToSet: { referralPoint: { point: xpPoint * 0.15, timestamp: Math.floor(Date.now() / 1000) } } },
      // { $inc: { referralPoint: xpPoint * 0.15 } },
      // { referralPoint: newXPPoint },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true, updatedUser, updatedReferrer })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const addMultiplierPermanent = async (req, res, next) => {
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
      { $inc: { multiplier_permanent: multiplier } },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true, data: point })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const addMultiplierTemporary = async (req, res, next) => {
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
      {
        $inc: { multiplier_temporary: multiplier },
        $set: { endTimestamp: Math.floor(Date.now() / 1000) + period * 24 * 3600 },
      },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true, data: point })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getOnChainPointList = async (req, res, next) => {
  try {
    const { period = 7 } = req.body // default period is 7 day

    const timestamp = Math.floor(Date.now() / 1000) - period * 24 * 60 * 60

    const query = `
  {
    trenXPPoints(
      where: {
        blockTimestamp_gte: "${timestamp}"
      },
      orderBy: blockTimestamp,
      orderDirection: desc
    ) {
      id
      account
      amount
      blockTimestamp
    }
  }`

    const url = process.env.SUBGRAPH_URL

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    const trenXPPoints = data.data.trenXPPoints

    const result = trenXPPoints.reduce((acc, point) => {
      const account = point.account
      const amount = BigInt(point.amount)

      if (acc[account]) {
        acc[account] += Number(amount / BigInt(10 ** 18))
      } else {
        acc[account] = Number(amount / BigInt(10 ** 18))
      }

      return acc
    }, {})

    return res.status(SUCCESS_CODE).send({ result: true, data: result })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getOffChainPointList = async (req, res, next) => {
  try {
    const pointsList = await Point.find({}).select('account xpPoint referralPoint')

    // await updateTreningPoints()

    return res.status(SUCCESS_CODE).send({ result: true, data: pointsList })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getUserOnChainPoint = async (req, res, next) => {
  try {
    const { account, period = 7 } = req.body // default period is 7 day

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    const timestamp = Math.floor(Date.now() / 1000) - period * 24 * 60 * 60

    const query = `
  {
    trenXPPoints(
      where: {
        blockTimestamp_gte: "${timestamp}",
        account: "${account}"
      },
      orderBy: blockTimestamp,
      orderDirection: desc
    ) {
      id
      account
      amount
      blockTimestamp
    }
  }`

    const url = process.env.SUBGRAPH_URL

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    const trenXPPoints = data.data.trenXPPoints

    const totalBorrowedAmount = trenXPPoints.reduce(
      (acc, point) => (acc + point.type == 0 ? BigInt(point.amount) : BigInt(0)),
      BigInt(0)
    )
    const totalStakedAmount = trenXPPoints.reduce(
      (acc, point) => (acc + point.type == 1 ? BigInt(point.amount) : BigInt(0)),
      BigInt(0)
    )
    return res.status(SUCCESS_CODE).send({
      result: true,
      data: {
        totalBorrowedAmount: Number(totalBorrowedAmount / BigInt(10 ** 18)),
        totalStakedAmount: Number(totalStakedAmount / BigInt(10 ** 18)),
      },
    })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getUserOffChainPoint = async (req, res, next) => {
  try {
    const account = req.params.account

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
