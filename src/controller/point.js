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
import { formatEther } from 'ethers/lib/utils.js'

export const distributeOffChainPoint = async (req, res, next) => {
  try {
    const { account, xpPoint = 0 } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account' })
    }

    const referrer = (await Referral.findOne({ redeemer: account.toLowerCase() })).owner

    const updatedUser = await Point.findOneAndUpdate(
      { account : account.toLowerCase() },
      { $addToSet: { xpPoint: { point: xpPoint * 0.85, timestamp: Math.floor(Date.now() / 1000) } } },
      { new: true, upsert: true }
    )
    const updatedReferrer = await Point.findOneAndUpdate(
      { account: referrer.toLowerCase() },
      { $addToSet: { referralPoint: { point: xpPoint * 0.15, timestamp: Math.floor(Date.now() / 1000) } } },
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
      { account : account.toLowerCase() },
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
    const { account, multiplier = 2, period = 1 } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid account' })
    }

    const point = await Point.findOne({ account : account.toLowerCase() })

    if (!point) return res.status(BAD_REQ_CODE).json({ result: false, message: 'Invalid account' })

    if (
      point &&
      point.multiplier_temporary &&
      point.multiplier_temporary.timestamp &&
      point.multiplier_temporary.timestamp > Math.floor(Date.now() / 1000)
    ) {
      return res
        .status(400)
        .json({ result: false, message: 'Current multiplier is still valid and cannot be updated.' })
    }

    const updatedPoint = await Point.findOneAndUpdate(
      { account : account.toLowerCase() },
      {
        $set: {
          'multiplier_temporary.value': multiplier,
          'multiplier_temporary.timestamp': Math.floor(Date.now() / 1000) + period * 24 * 3600,
        },
      },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true, data: updatedPoint })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getPointList = async (req, res, next) => {
  try {
    // Get on-chain Trening Points
    const query = `
    {
      treningBalances(where: { balance_gt: "0" }) {
        id
        balance
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
    console.log('data', data)
    const onChainPoints = data.data.treningBalances

    // Get off-chain Trening Points
    const offChainPoints = await Point.find({
      $or: [{ xpPoint: { $exists: true, $ne: [] } }, { referralPoint: { $exists: true, $ne: [] } }],
    }).select('account xpPoint referralPoint')

    // Combine on-chain and off-chain points
    const userPointsMap = new Map()

    // Process on-chain points
    onChainPoints.forEach((point) => {
      userPointsMap.set(point.id, {
        id: point.id,
        onChainPoints: +formatEther(point.balance),
        offChainXpPoints: 0,
        offChainReferralPoints: 0,
        totalPoints: +formatEther(point.balance), // Initialize with on-chain balance
      })
    })

    // Process off-chain points
    offChainPoints.forEach((point) => {
      const xpPointsSum = point.xpPoint.reduce((acc, xp) => acc + xp.point, 0)
      console.log('xpPointsSum', xpPointsSum)
      const referralPointsSum = point.referralPoint.reduce((acc, referral) => acc + referral.point, 0)

      if (userPointsMap.has(point.account.toLowerCase())) {
        console.log('point.account', point.account)
        const userPoints = userPointsMap.get(point.account.toLowerCase())
        console.log('userPoints', userPoints)
        userPoints.offChainXpPoints = xpPointsSum
        userPoints.offChainReferralPoints = referralPointsSum
        userPoints.totalPoints += xpPointsSum + referralPointsSum
      } else {
        userPointsMap.set(point.account, {
          id: point.account,
          onChainPoints: 0,
          offChainXpPoints: xpPointsSum,
          offChainReferralPoints: referralPointsSum,
          totalPoints: xpPointsSum + referralPointsSum,
        })
      }
    })

    // Convert Map to Array and sort by totalPoints in descending order
    const sortedUserPoints = Array.from(userPointsMap.values()).sort((a, b) => b.totalPoints - a.totalPoints)

    return res.status(SUCCESS_CODE).send({ result: true, data: sortedUserPoints })
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
      type
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
      (acc, point) => acc + (point.type == 0 ? BigInt(point.amount) : BigInt(0)),
      BigInt(0)
    )
    const totalStakedAmount = trenXPPoints.reduce(
      (acc, point) => acc + (point.type == 1 ? BigInt(point.amount) : BigInt(0)),
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

    const point = await Point.findOne({ account: account.toLowerCase() })

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

export const getUserPoint = async (req, res, next) => {
  try {
    const account = req.params.account
    const period = parseInt(req.query.period * 24 * 60 * 60) || 24 * 60 * 60 // Period in hours, default to 24 hours

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    const now = Math.floor(Date.now() / 1000)

    console.log('now - period', now - period)

    1721847047
    1716796536

    // Get on-chain Trening Points for the specific user within the last 24 hours
    const query = `
    {
      trenXPPoints(
        where: {
          blockTimestamp_gte: "${now - period}",
          account: "${account}"
        },
        orderBy: blockTimestamp,
        orderDirection: desc
      ) {
        id
        type
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
    console.log('data', data)
    const result = data.data.trenXPPoints

    const onChainPoints = result.reduce((acc, point) => acc + +formatEther(point.amount), 0)

    console.log('onChainPoints', onChainPoints)

    // Get off-chain Trening Points for the specific user within the last 24 hours
    const offChainPoints = await Point.findOne({
      account : account.toLowerCase(),
      // $or: [{ 'xpPoint.timestamp': { $gte: now - period } }, { 'referralPoint.timestamp': { $gte: now - period } }],
    }).select('account xpPoint referralPoint')

    // Summarize off-chain points
    let offChainXpPoints = 0
    let offChainReferralPoints = 0

    if (offChainPoints) {
      offChainXpPoints = offChainPoints.xpPoint
        .filter((xp) => xp.timestamp >= now - period)
        .reduce((acc, xp) => acc + xp.point, 0)

      offChainReferralPoints = offChainPoints.referralPoint
        .filter((referral) => referral.timestamp >= now - period)
        .reduce((acc, referral) => acc + referral.point, 0)
    }

    const totalPoints = onChainPoints + offChainXpPoints + offChainReferralPoints

    return res.status(SUCCESS_CODE).send({ result: true, data: totalPoints })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}
