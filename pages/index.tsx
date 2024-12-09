// pages/index.tsx
import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import ConnectWallet from '../components/ConnectWallet'
import AddSound from '../components/AddSound'
import MoogSynth from '../components/MoogSynth'
import SynthController from '../components/SynthController'
import MintCard from '../components/MintCard'
import { useReadContract } from 'wagmi'
import { CONTRACT_ABIS, CONTRACT_ADDRESS } from '@/utils/contractABI'

const Home: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [libraryAddress, setLibraryAddress] = useState<`0x${string}`>()
  const [currentPhase, setCurrentPhase] = useState<number>(0)
  const [merkleProof] = useState<string[]>([])
  const [generatedHex, setGeneratedHex] = useState<string>('')

  // Determine which contract address to read from:
  // For simplicity, we’ll assume mainnet here. You can modify this logic 
  // if you want to switch to anvilChain or sepolia based on the connected network.
  const contractAddress = CONTRACT_ADDRESS.anvil.MogSynthNFT as `0x${string}`

  // Read currentPhase from the contract using useReadContract
  const { data: phaseData} = useReadContract({
    abi: CONTRACT_ABIS.MogSynthNFT,
    address: contractAddress,
    functionName: 'currentPhase',
    // Only read when user is connected and we have a contract address
    query: {
      enabled: isConnected && Boolean(contractAddress),
    },
  })

  useEffect(() => {
    if (phaseData !== undefined) {
      // phaseData should be a number-like value that represents the Phase enum
      setCurrentPhase(Number(phaseData))
    }
  }, [phaseData])

  // Fetch the SoundLibrary address associated with the user
  useEffect(() => {
    const fetchLibraryAddress = async () => {
      if (!isConnected || !address) return

      try {
        const response = await fetch('/api/getLibraryAddress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userAddress: address }),
        })
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setLibraryAddress(data.libraryAddress)
      } catch (error) {
        console.error('Error fetching library address:', error)
      }
    }

    fetchLibraryAddress()
  }, [isConnected, address])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to Mog Synths</h1>
      <ConnectWallet />

      <SynthController onGenerate={(hexData) => setGeneratedHex(hexData)} />

      {!isConnected && (
        <p style={{ marginTop: '10px' }}>
          Connect your wallet to unlock more features like minting and adding sounds!
        </p>
      )}

      {generatedHex && (
        <div style={{ marginTop: '20px' }}>
          <h4>Generated Sound Bytecode:</h4>
          <textarea
            readOnly
            style={{ width: '100%', height: '100px' }}
            value={generatedHex}
          />
        </div>
      )}

      {isConnected && libraryAddress ? (
        <>
          <AddSound libraryAddress={libraryAddress} />
          <MoogSynth libraryAddress={libraryAddress} />
        </>
      ) : isConnected && !libraryAddress ? (
        <p>No SoundLibrary associated with your account.</p>
      ) : null}

      {isConnected && (
        <MintCard
          currentPhase={currentPhase}
          merkleProof={merkleProof}
          generatedHex={generatedHex}
        />
      )}
    </div>
  )
}

export default Home
