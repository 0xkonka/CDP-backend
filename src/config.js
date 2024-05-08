// export enum SupportedChainId {
//   MAINNET = 1,
//   SEPOLIA = 11155111,
// }

// type AddressMap = { [chainId: number]: string }

export const RPC_URL = {
  [SupportedChainId.MAINNET]: 'https://mainnet.infura.io/v3/',
  [SupportedChainId.SEPOLIA]: 'https://ethereum-sepolia-rpc.publicnode.com',
}

export const TRENING = {
  [SupportedChainId.MAINNET]: '',
  [SupportedChainId.SEPOLIA]: '',
}
