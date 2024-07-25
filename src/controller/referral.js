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
    let generatedCodes = []

    for (let i = 0; i < +count; i++) {
      let inviteCode
      let isExist

      do {
        inviteCode = generateRandomCode()
        isExist = await Referral.findOne({ inviteCode })
      } while (isExist) // Repeat if the code already exists
      await Referral.create({ owner: 'admin', inviteCode })
      generatedCodes.push(inviteCode)
    }

    return res.status(SUCCESS_CODE).send({ result: true, data: generatedCodes })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getAvalableInviteCodes = async (req, res, next) => {
  try {
    const referral = await Referral.find({ redeemed: false })
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
    const avalialbleInviteCodes = await Referral.find({ redeemed: false })
    const redeemedInviteCodes = await Referral.find({ redeemed: true })
    return res
      .status(SUCCESS_CODE)
      .send({ result: true, redeemedCodes: redeemedInviteCodes.length, availableCodes: avalialbleInviteCodes.length })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const distributeInviteCode = async (req, res, next) => {
  try {
    const { account, count = 1 } = req.body

    if (!account) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account' })
    }

    // for (let i = 0; i < +count; i++) {
    //   const docsToUpdate = await Referral.find({ owner: 'admin', redeemed: false })
    //     .limit(count) // Limit to 5 documents
    //     .select('_id') // Only fetch the _id field

    //   if (docsToUpdate.length == count) {
    //     const idsToUpdate = docsToUpdate.map((doc) => doc._id)
    //     const updateResult = await Referral.updateMany({ _id: { $in: idsToUpdate } }, { $set: { owner: account } })
    //     return res.status(SUCCESS_CODE).send({ result: true })
    //   } else {
    //     res.status(BAD_REQ_CODE).send({ result: false, messages: 'Not enough inviteCodes' })
    //   }
    // }

    let generatedCodes = []
    for (let i = 0; i < +count; i++) {
      let inviteCode
      let isExist

      do {
        inviteCode = generateRandomCode()
        isExist = await Referral.findOne({ inviteCode })
      } while (isExist) // Repeat if the code already exists
      await Referral.create({ owner: account, inviteCode })
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
    const { inviteCode } = req.body

    if (!inviteCode) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing inviteCode' })
    }

    const referral = await Referral.findOne({ inviteCode })

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
    const { account, count } = req.body

    if (!account || !count) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account or count' })
    }

    const isUserAlreadyRedeemed = await Referral.findOne({ redeemer: account })

    if (isUserAlreadyRedeemed)
      return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })

    await Referral.updateOne({ owner: 'admin', redeemed: false }, { $set: { redeemer: account, redeemed: true } })

    for (let i = 0; i < +count; i++)
      await Referral.updateOne({ owner: 'admin', redeemed: false }, { $set: { owner: account } })

    await Point.findOneAndUpdate({ account }, { multiplier_permanent: 2 }, { new: true, upsert: true })

    return res.status(SUCCESS_CODE).send({ result: true })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const redeemInviteCode = async (req, res, next) => {
  try {
    const { account, inviteCode, count } = req.body

    if (!account || !inviteCode || !count) {
      return res.status(BAD_REQ_CODE).json({ result: false, message: 'Missing account or inviteCode or count' })
    }

    const isUserAlreadyRedeemed = await Referral.findOne({ redeemer: account })
    const referral = await Referral.findOne({ inviteCode })

    if (isUserAlreadyRedeemed)
      return res.status(CONFLICT_CODE).send({ result: false, messages: 'You already redeemed' })
    if (!referral) return res.status(NOT_FOUND_CODE).send({ result: false, messages: 'InviteCode not found' })
    if (referral.redeemed)
      return res.status(CONFLICT_CODE).send({ result: false, messages: 'This inviteCode was already redeemed' })

    await Referral.updateOne({ inviteCode }, { $set: { redeemer: account, redeemed: true } })

    // for (let i = 0; i < +count; i++)
    // await Referral.updateOne({ owner: 'admin', redeemed: false }, { $set: { owner: account } })

    let generatedCodes = []
    for (let i = 0; i < +count; i++) {
      let inviteCode
      let isExist

      do {
        inviteCode = generateRandomCode()
        isExist = await Referral.findOne({ inviteCode })
      } while (isExist) // Repeat if the code already exists
      await Referral.create({ owner: account, inviteCode })
      generatedCodes.push(inviteCode)
    }

    await Point.findOneAndUpdate({ account }, { multiplier_permanent: 2 }, { new: true, upsert: true })

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

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    const userData = await Referral.findOne({ redeemed: true, redeemer: account })

    if (userData) {
      let redeemerData = await Referral.find({ owner: account })
      for (let i = 0; i < redeemerData.length; i++) {
        const redeemerPoint = await Point.findOne({ account: redeemerData[i].redeemer })
        if (redeemerPoint) redeemerData[i] = { ...redeemerData[i].toObject(), xpPoint: redeemerPoint.xpPoint }
      }
      return res
        .status(SUCCESS_CODE)
        .send({ result: true, redeemed: true, referralCode: userData.inviteCode, data: redeemerData })
    }
    return res.status(SUCCESS_CODE).send({ result: true, redeemed: false })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}

export const getUserReferrer = async (req, res, next) => {
  try {
    const account = req.params.account

    if (!account) return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })

    const referrer = await Referral.findOne({ redeemed: true, redeemer: account })

    if (referrer) return res.status(SUCCESS_CODE).send({ result: true, redeemed: true, referrer })

    return res.status(SUCCESS_CODE).send({ result: true, redeemed: false })
  } catch (error) {
    console.log('error', error)
    next(error)
    return res.status(SERVER_ERROR_CODE).send({ result: false, messages: SERVER_ERROR_MSG })
  }
}
