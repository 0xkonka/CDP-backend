import fetch from 'node-fetch'
import { Point } from '../models/Point.js'
import { treningPoints } from '../utils/web3.js'
import { Referral } from '../models/Referral.js'

const url = process.env.SUBGRAPH_URL

export async function updateTreningPoints(period = 7) {
  const timestamp = Math.floor(Date.now() / 1000) - period * 24 * 60 * 60

  // Get on-chain points
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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const data = await response.json()

  const onChainPoints = {}

  data.data.trenXPPoints.forEach((point) => {
    const { account, amount } = point
    if (!onChainPoints[account]) {
      onChainPoints[account] = BigInt(0) // Initialize with BigInt for large numbers
    }
    onChainPoints[account] += (BigInt(amount) * BigInt(10)) / BigInt(4)
  })

  console.log('onChainPoints', onChainPoints)

  // Get off-chain points
  const offChainPoints = await Point.find({ xpPoint: { $ne: 0 } }).select('account xpPoint')
  console.log('offChainPoints', offChainPoints)

  // Combine onchain & offchain points
  const combinedPoints = {}

  for (const [user, points] of Object.entries(onChainPoints)) {
    combinedPoints[user] = Number(points)
  }

  offChainPoints.forEach((point) => {
    const { account, xpPoint } = point
    if (combinedPoints[account]) {
      combinedPoints[account] += xpPoint
    } else {
      combinedPoints[account] = xpPoint
    }
  })

  console.log('combinedPoints', combinedPoints)

  const combinedPointsArray = Object.entries(combinedPoints).map(([user, points]) => {
    return { user, points }
  })

  console.log('combinedPointsArray', combinedPointsArray)

  // Fetch referrals from the database
  const referrals = await Referral.find({ redeemed: true })

  const updatedPointsArray = []

  // Distribute 15% of points to the referrer
  combinedPointsArray.forEach((entry) => {
    const referral = referrals.find((ref) => ref.redeemer === entry.user)
    if (referral) {
      const referrerPoints = (entry.points * 15) / 100
      const updatedPoints = entry.points - referrerPoints

      updatedPointsArray.push({ user: entry.user, points: updatedPoints })

      // Update the referrer entry or add a new entry
      const referrerEntry = updatedPointsArray.find((e) => e.user === referral.owner)
      if (referrerEntry) {
        referrerEntry.points += referrerPoints
      } else {
        console.log('referral', referral.owner)
        updatedPointsArray.push({ user: referral.owner, points: referrerPoints })
      }
    } else {
      updatedPointsArray.push(entry)
    }
  })

  console.log('updatedPointsArray', updatedPointsArray)

  // const tx = await treningPoints.updatePoints(combinedPointsArray)
  // await tx.wait()
  // console.log('tx', tx)

  // Set xpPoint to 0 for all updated accounts in the Point DB
  const updatedAccounts = combinedPointsArray.map((entry) => entry.user)
  await Point.updateMany({ account: { $in: updatedAccounts } }, { $set: { xpPoint: 0 } })
  console.log('Updated xpPoint to 0 for accounts:', updatedAccounts)
}
