import fetch from 'node-fetch'
import { Point } from '../models/Point.js'
import { treningPoints } from '../utils/web3.js'
import { Referral } from '../models/Referral.js'
import { getLastUpdateTime, updatePointStat } from '../controller/pointStat.js'
import { formatEther, parseEther } from 'ethers/lib/utils.js'

const url = process.env.SUBGRAPH_URL

/**
 * Main function to update training points.
 */
export const updateTreningPoints = async () => {
  try {
    const lastUpdateTime = await getLastUpdateTime()
    console.log('lastUpdateTime', lastUpdateTime)

    const timestamp = lastUpdateTime || Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60

    const onChainPoints = await fetchOnChainPoints(timestamp)
    console.log('onChainPoints', onChainPoints)

    const offChainPoints = await fetchOffChainPoints()
    console.log('offChainPoints', offChainPoints)

    const combinedPoints = combinePoints(onChainPoints, offChainPoints)
    console.log('combinedPointsArray', combinedPoints)

    const referrals = await Referral.find({ redeemed: true })
    const updatedPointsArray = await distributeReferralPoints(onChainPoints, referrals, combinedPoints)
    console.log('updatedPointsArray', updatedPointsArray)

    await resetXpPoints(updatedPointsArray)

    const tx = await treningPoints.updatePoints(updatedPointsArray)
    await tx.wait()
    console.log('tx', tx.hash)

    await updatePointStat()
  } catch (err) {
    console.log('err', err)
  }
}

/**
 * Fetch on-chain points from the subgraph.
 */
const fetchOnChainPoints = async (timestamp) => {
  const query = `
  {
    trenXPPoints(
      where: { blockTimestamp_gte: "${timestamp}" },
      orderBy: blockTimestamp,
      orderDirection: desc
    ) {
      id
      account
      amount
      blockTimestamp
    }
  }`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const data = await response.json()
  const onChainPoints = {}

  data.data.trenXPPoints.forEach((point) => {
    const { account, amount } = point
    if (!onChainPoints[account]) {
      onChainPoints[account.toLowerCase()] = BigInt(0) // Initialize with BigInt for large numbers
    }
    onChainPoints[account.toLowerCase()] += (BigInt(amount) * BigInt(10)) / BigInt(4)
  })

  return onChainPoints
}

/**
 * Fetch off-chain points from the database.
 */
const fetchOffChainPoints = async () => {
  return await Point.aggregate([
    // Add fields to calculate the sum of xpPoint and referralPoint with pending flag true
    {
      $addFields: {
        xpPoint_sum: { $sum: '$xpPoint.point' },
        referralPoint_filtered: {
          $filter: {
            input: '$referralPoint',
            as: 'referral',
            cond: { $eq: ['$$referral.pending', true] },
          },
        },
        referralPoint_sum: { $sum: '$referralPoint_filtered.point' },
      },
    },
    // 0xCAc35a5B2d47e3D2BDa9bd14b14D5FF71a34F1c2
    // Match documents where either sum is greater than 0
    {
      $match: {
        $or: [{ xpPoint_sum: { $gt: 0 } }, { referralPoint_sum: { $gt: 0 } }],
      },
    },
    // Project the required fields
    {
      $project: {
        account: 1,
        xpPoint: 1,
        referralPoint: 1,
        xpPoint_sum: 1,
        referralPoint_sum: 1,
      },
    },
  ])
}

/**
 * Combine on-chain and off-chain points.
 */
const combinePoints = (onChainPoints, offChainPoints) => {
  const combinedPoints = {}

  for (const [user, points] of Object.entries(onChainPoints)) {
    combinedPoints[user] = { onChain: points, total: points }
  }

  offChainPoints.forEach((point) => {
    const { account, xpPoint } = point
    const totalXpPoints = xpPoint.reduce((acc, xp) => acc + xp.point, 0)
    const lowerCaseAccount = account.toLowerCase()
    if (combinedPoints[lowerCaseAccount]) {
      combinedPoints[lowerCaseAccount].total += BigInt(totalXpPoints)
    } else {
      combinedPoints[lowerCaseAccount] = { onChain: BigInt(0), total: BigInt(totalXpPoints) }
    }
  })

  return Object.entries(combinedPoints).map(([user, points]) => ({
    user,
    onChain: points.onChain,
    total: points.total,
  }))
}

/**
 * Distribute 15% of on-chain points to referrers and update user points.
 */
const distributeReferralPoints = async (onChainPoints, referrals, combinedPointsArray) => {
  const updatedPointsMap = new Map()

  combinedPointsArray.forEach((entry) => {
    const user = entry.user.toLowerCase()
    const totalPoints = BigInt(entry.total)
    const onChainPointsForUser = onChainPoints[user] || BigInt(0)

    // Update total points in the map
    if (updatedPointsMap.has(user)) {
      updatedPointsMap.set(user, updatedPointsMap.get(user) + totalPoints)
    } else {
      updatedPointsMap.set(user, totalPoints)
    }

    // Distribute 15% of on-chain points to referrer
    const referral = referrals.find((ref) => ref.redeemer.toLowerCase() === user)
    if (referral) {
      const referrerPoints = (onChainPointsForUser * BigInt(15)) / BigInt(100)
      const updatedPoints = totalPoints - referrerPoints

      updatedPointsMap.set(user, updatedPoints)

      const referrer = referral.owner.toLowerCase()
      if (referrer !== 'admin') {
        if (updatedPointsMap.has(referrer)) {
          updatedPointsMap.set(referrer, updatedPointsMap.get(referrer) + referrerPoints)
        } else {
          updatedPointsMap.set(referrer, referrerPoints)
        }
      }
    }
  })

  const updatedPointsArray = Array.from(updatedPointsMap, ([user, points]) => ({ user, points }))
  return updatedPointsArray
}

/**
 * Reset xpPoint to 0 for updated accounts in the Point DB and set pending to false for referralPoint.
 */
const resetXpPoints = async (updatedPointsArray) => {
  const updatedAccounts = updatedPointsArray.map((entry) => entry.user.toLowerCase())

  console.log('updatedAccounts', updatedAccounts)

  // Fetch accounts from the database and convert to lowercase for comparison
  const accounts = await Point.find({ account: { $in: updatedAccounts } }, { account: 1 })
  const accountsToUpdate = accounts
    .filter((acc) => updatedAccounts.includes(acc.account.toLowerCase()))
    .map((acc) => acc.account)

  console.log('accountsToUpdate', accountsToUpdate)

  // Update the documents in MongoDB
  await Point.updateMany(
    { account: { $in: accountsToUpdate } },
    { $set: { xpPoint: [], 'referralPoint.$[].pending': false } }
  )

  console.log('Updated xpPoint to 0 and set pending to false for referralPoint for accounts:', accountsToUpdate)
}
