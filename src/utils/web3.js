import { ethers, providers } from 'ethers'
import TreningABI from '../abi/Trening.json' assert { type: 'json' };
import { config } from '../config.js'
import dotenv from 'dotenv';

dotenv.config();

const { NETWORK, DEPLOY_KEY } = process.env

const contracts = config['contracts'][NETWORK]
const rpcUrl = config['rpcUrl'][NETWORK]
const provider = new providers.JsonRpcProvider(rpcUrl)

const pointKeeper = new ethers.Wallet(DEPLOY_KEY).connect(provider)

export const treningPoints = new ethers.Contract(contracts.Trening, TreningABI, pointKeeper)
