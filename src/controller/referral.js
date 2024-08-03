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
import { Referral } from '../models/Referral.js'
import { generateRandomCode } from '../utils/index.js'
import { Point } from '../models/Point.js'

export const generateInviteCode = async (req, res, next) => {
  try {
    const count = req.body.count || 1
    const inviteCodeType = req.body.inviteCodeType || 'testnet'
    let generatedCodes = []

    for (let i = 0; i < +count; i++) {
      let inviteCode
      let isExist

      do {
        inviteCode = generateRandomCode()
        isExist = await Referral.findOne({ inviteCode })
      } while (isExist) // Repeat if the code already exists
      await Referral.create({ owner: 'admin', inviteCode, type: inviteCodeType })
      generatedCodes.push(inviteCode)
    }

    return res.status(SUCCESS_CODE).send({ result: true, data: generatedCodes })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getAvailableInviteCodes = async (req, res, next) => {
  try {
    const inviteCodeType = req.body.inviteCodeType || 'testnet'
    const referral = await Referral.find({ redeemed: false, type: inviteCodeType })
    let newCode = [],
      hasOwner = []
    for (let i = 0; i < referral.length; i++) {
      if (referral[i].owner === 'admin') newCode.push(referral[i].inviteCode)
      else hasOwner.push(referral[i].inviteCode)
    }
    return res.status(SUCCESS_CODE).send({ newCode, hasOwner })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getInviteCodeStatus = async (req, res, next) => {
  try {
    const inviteCodeType = req.query.inviteCodeType || 'testnet'
    const availableInviteCodes = await Referral.find({ redeemed: false, type: inviteCodeType })
    const redeemedInviteCodes = await Referral.find({ redeemed: true, type: inviteCodeType })
    return res.status(SUCCESS_CODE).send({
      result: true,
      redeemedCodes: redeemedInviteCodes.length,
      availableCodes: availableInviteCodes.length,
    })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const distributeInviteCode = async (req, res, next) => {
  try {
    const { account, count = 1, inviteCodeType = 'testnet' } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account' })
    }

    console.log('inviteCodeType', inviteCodeType)
    if (inviteCodeType == 'mainnet') {
      const isUserAlreadyOwner = await Referral.findOne({ owner: account.toLowerCase(), type: inviteCodeType })
      console.log('isUserAlreadyOwner', isUserAlreadyOwner)
      if (isUserAlreadyOwner) return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })
    }

    let generatedCodes = []
    for (let i = 0; i < +count; i++) {
      let inviteCode
      let isExist

      do {
        inviteCode = generateRandomCode()
        isExist = await Referral.findOne({ inviteCode })
      } while (isExist) // Repeat if the code already exists
      await Referral.create({ owner: account.toLowerCase(), inviteCode, type: inviteCodeType })
      generatedCodes.push(inviteCode)
    }
    return res.status(SUCCESS_CODE).send({ result: true, data: generatedCodes })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const validateInviteCode = async (req, res, next) => {
  try {
    const { inviteCode, inviteCodeType = 'testnet' } = req.body

    if (!inviteCode) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing inviteCode' })
    }

    const referral = await Referral.findOne({ inviteCode, type: inviteCodeType })

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

export const adminRedeemInviteCode = async (req, res, next) => {
  try {
    const { account, count, inviteCodeType = 'testnet' } = req.body

    if (!account || !count) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account or count' })
    }

    if (inviteCodeType === 'testnet') {
      const isUserAlreadyRedeemed = await Referral.findOne({ redeemer: account.toLowerCase(), type: inviteCodeType })
      if (isUserAlreadyRedeemed)
        return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })

      await Referral.updateOne(
        { owner: 'admin', redeemed: false, type: inviteCodeType },
        { $set: { redeemer: account.toLowerCase(), redeemed: true } }
      )
    } else if (inviteCodeType === 'mainnet') {
      
      const isUserAlreadyOwner = await Referral.findOne({ owner: account.toLowerCase(), type: inviteCodeType })
      if (isUserAlreadyOwner) return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })

      await Referral.updateOne(
        { owner: 'admin', type: inviteCodeType },
        { $addToSet: { redeemer: account.toLowerCase() }, $set: { redeemed: true } }
      )
    }

    for (let i = 0; i < +count; i++) {
      await Referral.updateOne(
        { owner: 'admin', redeemed: false, type: inviteCodeType },
        { $set: { owner: account.toLowerCase() } }
      )
    }

    await Point.findOneAndUpdate(
      { account: account.toLowerCase() },
      { multiplier_permanent: 2 },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const redeemInviteCode = async (req, res, next) => {
  try {
    const { account, inviteCode, count, inviteCodeType = 'testnet' } = req.body

    if (!account || !inviteCode || !count) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account or inviteCode or count' })
    }

    const referral = await Referral.findOne({ inviteCode, type: inviteCodeType })
    if (!referral) return res.status(NOT_FOUND_CODE).send({ result: false, messages: 'InviteCode not found' })

    if (inviteCodeType === 'testnet') {
      const isUserAlreadyRedeemed = await Referral.findOne({ redeemer: account.toLowerCase(), type: inviteCodeType })
      if (isUserAlreadyRedeemed)
        return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })
      if (referral.redeemed) {
        return res.status(CONFLICT_CODE).send({ result: false, messages: 'This inviteCode was already redeemed' })
      }
      await Referral.updateOne(
        { inviteCode, type: inviteCodeType },
        { $set: { redeemer: account.toLowerCase(), redeemed: true } }
      )
    } else if (inviteCodeType === 'mainnet') {
      const isUserAlreadyOwner = await Referral.findOne({ owner: account.toLowerCase(), type: inviteCodeType })
      if (isUserAlreadyOwner) return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })

      await Referral.updateOne(
        { inviteCode, type: inviteCodeType },
        { $addToSet: { redeemer: account.toLowerCase() }, $set: { redeemed: true } }
      )
    }

    let generatedCodes = []
    for (let i = 0; i < +count; i++) {
      let inviteCode
      let isExist

      do {
        inviteCode = generateRandomCode()
        isExist = await Referral.findOne({ inviteCode })
      } while (isExist) // Repeat if the code already exists
      await Referral.create({ owner: account.toLowerCase(), inviteCode, type: inviteCodeType })
      generatedCodes.push(inviteCode)
    }

    await Point.findOneAndUpdate(
      { account: account.toLowerCase() },
      { multiplier_permanent: 2 },
      { new: true, upsert: true }
    )

    return res.status(SUCCESS_CODE).send({ result: true, data: generatedCodes })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getUserReferral = async (req, res, next) => {
  try {
    const account = req.params.account
    const inviteCodeType = req.query.inviteCodeType || 'testnet'

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    if (inviteCodeType == 'testnet') {
      const userData = await Referral.findOne({
        redeemed: true,
        type: inviteCodeType,
        $or: [{ redeemer: account.toLowerCase() }, { redeemer: account }],
      })

      if (userData) {
        let redeemerData = await Referral.find({
          type: inviteCodeType,
          $or: [{ owner: account.toLowerCase() }, { owner: account }],
        })
        for (let i = 0; i < redeemerData.length; i++) {
          const redeemerPoint = await Point.findOne({
            account: redeemerData[i].redeemer && redeemerData[i].redeemer.toLowerCase(),
          })
          if (redeemerPoint) redeemerData[i] = { ...redeemerData[i].toObject(), xpPoint: redeemerPoint.xpPoint }
        }
        return res
          .status(SUCCESS_CODE)
          .send({ result: true, redeemed: true, referralCode: userData.inviteCode, data: redeemerData })
      }
      return res.status(SUCCESS_CODE).send({ result: true, redeemed: false })
    } else if (inviteCodeType == 'mainnet') {
      const userData = await Referral.findOne({
        type: inviteCodeType,
        redeemer: { $in: [account.toLowerCase(), account] },
      })

      if (userData) {
        let redeemerData = await Referral.findOne({
          type: inviteCodeType,
          $or: [{ owner: account.toLowerCase() }, { owner: account }],
        })
        if (redeemerData && redeemerData.redeemer) {
          const updatedRedeemerData = []

          for (let i = 0; i < redeemerData.redeemer.length; i++) {
            const redeemerAccount = redeemerData.redeemer[i].toLowerCase()
            const redeemerPoint = await Point.findOne({ account: redeemerAccount })

            updatedRedeemerData.push({
              redeemer: redeemerAccount,
              xpPoint: redeemerPoint ? redeemerPoint.xpPoint : 0,
            })
          }

          redeemerData = { ...redeemerData.toObject(), redeemer: updatedRedeemerData }
        }

        return res
          .status(SUCCESS_CODE)
          .send({ result: true, redeemed: true, referralCode: userData.inviteCode, data: redeemerData })
      }

      return res.status(SUCCESS_CODE).send({ result: true, redeemed: false })
    }
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

// export const getUserReferrer = async (req, res, next) => {
//   try {
//     const account = req.params.account
//     const inviteCodeType = req.query.inviteCodeType || 'testnet'

//     if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

//     const referrer = await Referral.findOne({ redeemed: true, redeemer: account.toLowerCase(), type: inviteCodeType })

//     if (referrer) return res.status(SUCCESS_CODE).send({ result: true, redeemed: true, referrer })

//     return res.status(SUCCESS_CODE).send({ result: true, redeemed: false })
//   } catch (error) {
//     console.log('error', error)
//     next(error)
//     return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
//   }
// }
