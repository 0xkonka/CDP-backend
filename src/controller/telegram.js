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
    const { userId, referrerId } = req.body

    if (!userId) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId' })
    }

    const existingUser = await Telegram.findOne({ userId })

    if (existingUser) {
      return res.status(CONFLICT_CODE).json({ result: false, message: 'UserId already exists' })
    }

    let newUser

    if (referrerId && referrerId !== '') {
      const referrer = await Telegram.findOne({ userId: referrerId })

      if (!referrer) {
        return res.status(NOT_FOUND_CODE).json({ result: false, message: 'Referrer not found' })
      }

      // Check the total number of referrals
      const referrerCount = referrer.referrers.length

      // Add bonus points based on referral count
      let bonusPoints = 2000
      if (referrerCount + 1 === 5) {
        bonusPoints += 2500
      } else if (referrerCount + 1 === 10) {
        bonusPoints += 5000
      } else if (referrerCount + 1 === 25) {
        bonusPoints += 125000
      }

      await Telegram.findOneAndUpdate(
        { userId: referrerId },
        { $inc: { telegramPoint: bonusPoints }, $addToSet: { referrers: userId } },
        { new: true }
      )

      newUser = new Telegram({ userId, telegramPoint: 2000 })
      await newUser.save()
    } else {
      newUser = new Telegram({ userId })
      await newUser.save()
    }

    return res.status(SUCCESS_CODE).json({ result: true, data: newUser })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).json({ result: false, message: SERVER_ERROR_MSG })
  }
}

// Helper function to calculate if 8 hours have passed
const has8HoursPassed = (timestamp) => {
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime - timestamp >= 8 * 60 * 60
}

export const startFarmingPoint = async (req, res, next) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId' })
    }

    const user = await Telegram.findOne({ userId })

    if (user.farmStartingTime === 0) {
      // User has never farmed yet
      await Telegram.findOneAndUpdate({ userId }, { farmStartingTime: Math.floor(Date.now() / 1000) }, { new: true })

      return res.status(SUCCESS_CODE).json({ result: true, message: 'Farming started for the first time' })
    }

    if (user && has8HoursPassed(user.farmStartingTime)) {
      // const newTelegramPoint = user.telegramPoint + 8 * 25

      const updatedUser = await Telegram.findOneAndUpdate(
        { userId },
        { $inc: { telegramPoint: 8 * 25 }, $set: { farmStartingTime: Math.floor(Date.now() / 1000) } },
        // { farmStartingTime: Math.floor(Date.now() / 1000), telegramPoint: newTelegramPoint },
        { new: true }
      )

      return res.status(SUCCESS_CODE).json({ result: true, data: updatedUser.telegramPoint })
    } else {
      return res
        .status(CONFLICT_CODE)
        .json({ result: false, message: '8 hours have not passed since last farming start' })
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
    const { userId, social } = req.body

    if (!userId || !social) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId, social, or status' })
    }

    const update = {}
    update[`socialTaskStatus.${social}`] = true

    const user = await Telegram.findOneAndUpdate(
      { userId },
      { $inc: { telegramPoint: 200 }, $set: update },
      { new: true }
    )

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
