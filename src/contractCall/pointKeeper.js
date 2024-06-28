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
    const updatedPointsArray = await distributeReferralPoints(combinedPoints, referrals)
    console.log('updatedPointsArray', updatedPointsArray)

    await resetXpPoints(updatedPointsArray)

    const referralPointsMap = calculateReferralPoints(updatedPointsArray, referrals)
    // console.log('referralPointsMap', referralPointsMap)

    await updateReferralPoints(referralPointsMap)

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
  return await Point.find({ xpPoint: { $ne: 0 } }).select('account xpPoint')
}

/**
 * Combine on-chain and off-chain points.
 */
const combinePoints = (onChainPoints, offChainPoints) => {
  const combinedPoints = {}

  for (const [user, points] of Object.entries(onChainPoints)) {
    combinedPoints[user] = points
  }

  offChainPoints.forEach((point) => {
    const { account, xpPoint } = point
    if (combinedPoints[account.toLowerCase()]) {
      combinedPoints[account.toLowerCase()] = parseEther(xpPoint.toString()).add(combinedPoints[account])
    } else {
      combinedPoints[account.toLowerCase()] = parseEther(xpPoint.toString())
    }
  })

  return Object.entries(combinedPoints).map(([user, points]) => ({ user, points }))
}

/**
 * Distribute 15% of points to referrers and update user points.
 */
const distributeReferralPoints = async (combinedPointsArray, referrals) => {
  const updatedPointsMap = new Map();

  combinedPointsArray.forEach((entry) => {
    const user = entry.user.toLowerCase();
    const points = BigInt(entry.points);
    if (updatedPointsMap.has(user)) {
      updatedPointsMap.set(user, updatedPointsMap.get(user) + points);
    } else {
      updatedPointsMap.set(user, points);
    }

    const referral = referrals.find((ref) => ref.redeemer.toLowerCase() === user);
    if (referral) {
      const referrerPoints = (points * BigInt(15)) / BigInt(100);
      const updatedPoints = points - referrerPoints;

      updatedPointsMap.set(user, updatedPoints);

      const referrer = referral.owner.toLowerCase();
      if (referrer !== 'admin') {
        if (updatedPointsMap.has(referrer)) {
          updatedPointsMap.set(referrer, updatedPointsMap.get(referrer) + referrerPoints);
        } else {
          updatedPointsMap.set(referrer, referrerPoints);
        }
      }
    }
  });

  const updatedPointsArray = Array.from(updatedPointsMap, ([user, points]) => ({ user, points }));
  return updatedPointsArray;
};

/**
 * Reset xpPoint to 0 for updated accounts in the Point DB.
 */
const resetXpPoints = async (updatedPointsArray) => {
  const updatedAccounts = updatedPointsArray.map((entry) => entry.user)
  await Point.updateMany({ account: { $in: updatedAccounts } }, { $set: { xpPoint: 0 } })
  console.log('Updated xpPoint to 0 for accounts:', updatedAccounts)
}

/**
 * Calculate referral points to be updated in the Point DB.
 */
const calculateReferralPoints = (updatedPointsArray, referrals) => {
  const referralPointsMap = {}

  updatedPointsArray.forEach((entry) => {
    const referral = referrals.find((ref) => ref.redeemer === entry.user)
    if (referral) {
      const referrerPoints = (entry.points * BigInt(15)) / BigInt(100)
      if (referralPointsMap[referral.owner]) {
        referralPointsMap[referral.owner] += +formatEther(referrerPoints)
      } else {
        referralPointsMap[referral.owner] = +formatEther(referrerPoints)
      }
    }
  })

  return referralPointsMap
}

/**
 * Update referral points in the Point DB.
 */
const updateReferralPoints = async (referralPointsMap) => {
  const referralUpdates = Object.entries(referralPointsMap).map(([account, points]) => ({
    updateOne: {
      filter: { account },
      update: { $inc: { referralPoint: points } },
      upsert: true,
    },
  }))

  await Point.bulkWrite(referralUpdates)
  console.log('Updated referral points for accounts:', Object.keys(referralPointsMap))
}
