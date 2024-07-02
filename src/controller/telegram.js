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
import { Telegram } from '../models/Telegram.js'

export const createUserId = async (req, res, next) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId' })
    }

    const existingUser = await Telegram.findOne({ userId })

    if (existingUser) {
      return res.status(CONFLICT_CODE).json({ result: false, message: 'UserId already exists' })
    }

    const newUser = new Telegram({ userId })
    await newUser.save()

    return res.status(SUCCESS_CODE).json({ result: true, data: newUser })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).json({ result: false, message: SERVER_ERROR_MSG })
  }
}

// Helper function to calculate if 24 hours have passed
const has24HoursPassed = (timestamp) => {
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime - timestamp >= 86400 // 86400 seconds in 24 hours
}

export const startFarmingPoint = async (req, res, next) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId' })
    }

    const user = await Telegram.findOne({ userId })

    if (user && has24HoursPassed(user.farmStartingTime)) {
      const newFarmingPoint = user.farmingPoint ? user.farmingPoint + 100 : 1 // Assuming 100 points for 24 hours farming

      await Telegram.findOneAndUpdate(
        { userId },
        { farmStartingTime: Math.floor(Date.now() / 1000), farmingPoint: newFarmingPoint },
        { new: true }
      )

      return res.status(SUCCESS_CODE).json({ result: true, data: newFarmingPoint })
    } else if (!user) {
      await Telegram.create({
        userId,
        farmStartingTime: Math.floor(Date.now() / 1000),
        farmingPoint: 0, // Initial points for new user
      })

      return res.status(SUCCESS_CODE).json({ result: true, data: user.farmingPoint })
    } else {
      return res
        .status(CONFLICT_CODE)
        .json({ result: false, message: '24 hours have not passed since last farming start' })
    }
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).json({ result: false, message: SERVER_ERROR_MSG })
  }
}

export const getUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId' })
    }

    const user = await Telegram.findOne({ userId })

    if (!user) {
      return res.status(NOT_FOUND_CODE).json({ result: false, message: 'User not found' })
    }

    return res.status(SUCCESS_CODE).json({ result: true, data: user })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).json({ result: false, message: SERVER_ERROR_MSG })
  }
}

export const addWalletToTelegram = async (req, res, next) => {
  try {
    const { userId, account } = req.body

    if (!userId || !account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId or account' })
    }

    const user = await Telegram.findOneAndUpdate({ userId }, { account }, { new: true, upsert: true })

    return res.status(SUCCESS_CODE).json({ result: true, data: user })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).json({ result: false, message: SERVER_ERROR_MSG })
  }
}

export const updateSocialTaskStatus = async (req, res, next) => {
  try {
    const { userId, social, status } = req.body

    if (!userId || !social || typeof status === 'undefined') {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId, social, or status' })
    }

    const update = {}
    update[`socialTaskStatus.${social}`] = status

    const user = await Telegram.findOneAndUpdate({ userId }, { $set: update }, { new: true })

    if (!user) {
      return res.status(NOT_FOUND_CODE).json({ result: false, message: 'User not found' })
    }

    return res.status(SUCCESS_CODE).json({ result: true, data: user })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).json({ result: false, message: SERVER_ERROR_MSG })
  }
}

export const addReferrer = async (req, res, next) => {
  try {
    const { userId, referrer } = req.body

    if (!userId || !referrer) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId or referrer' })
    }

    const user = await Telegram.findOneAndUpdate({ userId }, { $addToSet: { referrers: referrer } }, { new: true })

    if (!user) {
      return res.status(NOT_FOUND_CODE).json({ result: false, message: 'User not found' })
    }

    return res.status(SUCCESS_CODE).json({ result: true, data: user })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).json({ result: false, message: SERVER_ERROR_MSG })
  }
}
