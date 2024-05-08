import { ethers, providers } from 'ethers'
import TreningABI from '../abi/Trening.json'
import { TRENING } from '../config'

const { DEPLOY_KEY } = process.env

// export enum Network {
//   mainnet,
//   sepolia
// }

export const timeLock = (network) => {
  if (!DEPLOY_KEY) {
    throw new Error('Please define the DEPLOY_KEY environment variable');
  }
  const provider = new providers.JsonRpcProvider(TRENING[network])

  const signers = new ethers.Wallet(DEPLOY_KEY).connect(provider)

  return new ethers.Contract(TRENING[network], TreningABI, signers)
}
