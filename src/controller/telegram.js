import axios from 'axios'
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
      return res.status(SUCCESS_CODE).json({ result: true, message: 'UserId already exists' })
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
        {
          $inc: { referralPoint: bonusPoints },
          $addToSet: { referrers: { referrerId: userId, timestamp: Math.floor(Date.now() / 1000) } },
        },
        { new: true }
      )

      newUser = new Telegram({ userId, farmingPoint: 2000 })
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

export const registerUser = async (req, res, next) => {
  try {
    const { userId, userName } = req.body

    if (!userId || !userName) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing userId or userName' })
    }

    const existingUser = await Telegram.findOne({ userId })

    if (!existingUser) {
      return res.status(SUCCESS_CODE).json({ result: false, message: 'UserId no exists' })
    }

    if (existingUser.userName)
      return res.status(SUCCESS_CODE).json({ result: false, message: 'Username already exists' })

    const registeredUser = await Telegram.findOneAndUpdate({ userId }, { userName })

    return res.status(SUCCESS_CODE).json({ result: true, data: registeredUser })
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

    if (!user) {
      return res.status(NOT_FOUND_CODE).json({ result: false, message: 'User not found' })
    }

    if (user && has8HoursPassed(user.farmStartingTime)) {
      if (user.farmStartingTime == 0) {
        // if 0, farming point was already increased via cron job
        const updatedUser = await Telegram.findOneAndUpdate(
          { userId },
          { $set: { farmStartingTime: Math.floor(Date.now() / 1000) } },
          { new: true }
        )

        return res.status(SUCCESS_CODE).json({ result: true, data: updatedUser.farmingPoint })
      } else {
        const updatedUser = await Telegram.findOneAndUpdate(
          { userId },
          { $inc: { farmingPoint: 200 }, $set: { farmStartingTime: Math.floor(Date.now() / 1000) } },
          // { farmStartingTime: Math.floor(Date.now() / 1000), farmingPoint: newTelegramPoint },
          { new: true }
        )
        await sendTelegramMessage(userId)

        return res.status(SUCCESS_CODE).json({ result: true, data: updatedUser.farmingPoint })
      }
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

export const getAppStatus = async (req, res, next) => {
  try {
    const totalUser = (await Telegram.find({})).length
    const registeredUser = await Telegram.countDocuments({ userId: { $exists: true }, userName: { $exists: true } })
    const convertionRate = registeredUser / totalUser
    const peopleJoinedThroughReferral = await countJoinedThroughReferral()
    const averageReferrals = await averageReferralsPerUser()

    return res
      .status(SUCCESS_CODE)
      .json({ result: true, totalUser, registeredUser, convertionRate, peopleJoinedThroughReferral, averageReferrals })
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
      { $inc: { farmingPoint: 100 }, $set: update },
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

export const sendNotifications = async () => {
  try {
    const TGUsers = await Telegram.find({})

    for (const user of TGUsers) {
      if (user.farmStartingTime !== 0 && Math.floor(Date.now() / 1000) - user.farmStartingTime > 8 * 3600) {
        console.log('user.userId', user.userId)
        await Telegram.findOneAndUpdate(
          { userId: user.userId },
          { farmStartingTime: 0, $inc: { farmingPoint: 200 } },
          { new: true }
        )

        // const response = await axios.post('https://telegram.tren.finance/completed-farming', { user_id: user.userId })

        await sendTelegramMessage(user.userId)

        console.log(`Notification sent for user: ${user.userId}`)
      }
    }
  } catch (error) {
    console.log('error')
    // console.error('Error in sendNotifications:', error.data);
  }
}

const sendTelegramMessage = async (chatId) => {
  const text = 'Congrats!\n\nYou’ve earned 200 points by farming. Head over to the app to start farming again.'
  const TASK_WEB_APP_URL_FARM = 'https://miniapp.tren.finance/farm.html'
  const keyboard = [[{ text: '→ Start Farming', web_app: { url: TASK_WEB_APP_URL_FARM } }]]
  const replyMarkup = { inline_keyboard: keyboard }

  const { BOT_TOKEN } = process.env

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text: text,
      reply_markup: replyMarkup,
    })
    return response.data
  } catch (error) {
    console.error('Error sending Telegram message:', error.response ? error.response.data : error.message)
    throw error
  }
}

const countJoinedThroughReferral = async () => {
  const result = await Telegram.aggregate([
    {
      $match: {
        'referrers.0': { $exists: true },
      },
    },
    {
      $count: 'peopleJoinedThroughReferral',
    },
  ])

  return result[0]?.peopleJoinedThroughReferral || 0
}

// Requirement 5: How Many People Each User Refers on Average
const averageReferralsPerUser = async () => {
  const result = await Telegram.aggregate([
    {
      $addFields: {
        numberOfReferrals: { $size: '$referrers' },
      },
    },
    {
      $group: {
        _id: null,
        averageReferrals: { $avg: '$numberOfReferrals' },
      },
    },
  ])

  return result[0]?.averageReferrals || 0
}
