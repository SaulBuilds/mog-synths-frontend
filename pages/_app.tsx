// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { http } from 'wagmi'

// Define your local Anvil chain
const anvilChain = {
  id: 31337,
  name: 'Anvil Localhost',
  network: 'anvil',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://127.0.0.1:8545' },
  },
  testnet: true,
}

const queryClient = new QueryClient()

// Configure with mainnet, sepolia, and the local anvil chain
const config = getDefaultConfig({
  appName: 'RainbowKit demo',
  projectId: 'dc89550bc1185af6a1c0a6634de515f0',
  chains: [mainnet, sepolia, anvilChain],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [anvilChain.id]: http(),
  },
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}

export default MyApp
