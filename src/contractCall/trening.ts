const { referralStorage, timeLock } = require('../utils/web3')

export async function updateAccount(account: any) {
  const timelock = await referralStorage.gov()
  console.log('timelock', timelock)
  const tier = 2 // tier 1, 2, 3

  console.log('account', account)

  const currentTier = (await referralStorage.referrerTiers(account)).add(1)
  console.log('currentTier', currentTier.toString())

  if (!currentTier.eq(1)) {
    throw new Error('Current tier is more than 1')
  }

  console.log('updating to tier', tier)
  const tx = await timeLock.setReferrerTier(referralStorage.address, account, tier - 1)
  await tx.wait()
}
