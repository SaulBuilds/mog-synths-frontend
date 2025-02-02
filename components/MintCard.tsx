// components/MintCard.tsx
import React, { useMemo } from 'react'
import { parseEther } from 'viem'
import MintButton from './MintButton'

enum Phase {
  Locked,
  Presale,
  Whitelist,
  Public,
}

interface MintCardProps {
  currentPhase: number;
  merkleProof: string[];
  generatedHex: string;
}

const MintCard: React.FC<MintCardProps> = ({ currentPhase, merkleProof, generatedHex }) => {

  // Convert numeric phase to enum for display
  const phaseName = useMemo(() => {
    switch (currentPhase) {
      case Phase.Presale: return 'Presale';
      case Phase.Whitelist: return 'Whitelist';
      case Phase.Public: return 'Public';
      default: return 'Locked';
    }
  }, [currentPhase])

  // Dynamically calculate mint price based on the phase for display
  const mintPrice = useMemo(() => {
    let priceWei = parseEther('0')
    switch (currentPhase) {
      case Phase.Presale:
        priceWei = parseEther('0.05')
        break
      case Phase.Whitelist:
        priceWei = parseEther('0.08')
        break
      case Phase.Public:
        priceWei = parseEther('0.1')
        break
      default:
        priceWei = parseEther('0')
        break
    }
    const priceEth = Number(priceWei) / 1e18
    return priceEth
  }, [currentPhase])

  return (
    <div style={{
      marginTop: '20px',
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '20px',
      maxWidth: '400px',
      margin: '20px auto',
      background: '#f9f9f9',
      textAlign: 'left'
    }}>
      <h3>Mint Your MogSynth NFT</h3>

      {generatedHex && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Generated Bytecode:</h4>
          <textarea
            readOnly
            style={{ width: '100%', height: '100px' }}
            value={generatedHex}
          />
        </div>
      )}

      <p>
        Current Phase: <strong>{phaseName}</strong>
      </p>
      <p>
        Price: {mintPrice > 0 ? `${mintPrice} ETH` : 'N/A'}
      </p>

      {/* MintButton takes currentPhase as Phase enum and merkleProof */}
      {/* Here we cast currentPhase to the Phase enum type */}
      <MintButton currentPhase={currentPhase as Phase} merkleProof={merkleProof} />
    </div>
  )
}

export default MintCard
