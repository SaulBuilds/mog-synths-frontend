// utils/config.ts
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect, metaMask } from 'wagmi/connectors'

const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID' // Replace with your WalletConnect Project ID

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'), // Replace with your RPC URL
    [sepolia.id]: http('https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'), // Replace with your RPC URL
  },
  // Optional configurations
  multiInjectedProviderDiscovery: false,
  ssr: false,
  storage: null,
  syncConnectedChain: true,
  batch: { multicall: true },
  cacheTime: 5 * 60 * 1000, // 5 minutes
  pollingInterval: 4_000, // 4 seconds
})
