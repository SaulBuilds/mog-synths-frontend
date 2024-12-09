import React, { useMemo, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ABIS, CONTRACT_ADDRESS } from '@/utils/contractABI';

enum Phase {
  Locked,
  Presale,
  Whitelist,
  Public,
}

interface MintButtonProps {
  currentPhase: Phase;
  merkleProof: string[];
}


const MintButton: React.FC<MintButtonProps> = ({ currentPhase, merkleProof }) => {
  const [error] = useState<string | null>(null);

  // Dynamically calculate mint price based on the phase
  const getMintPrice = useMemo(() => {
    switch (currentPhase) {
      case Phase.Presale:
        return parseEther('0.05');
      case Phase.Whitelist:
        return parseEther('0.08');
      case Phase.Public:
        return parseEther('0.1');
      default:
        return parseEther('0');
    }
  }, [currentPhase]);

  // Create mint arguments dynamically to include the Merkle Proof and price
  const mintArgs = useMemo(() => {
    const priceHex = `0x${BigInt(getMintPrice).toString(16)}`; // Convert mint price to hex
    if (currentPhase === Phase.Whitelist) {
      return [merkleProof, priceHex]; // Pass Merkle Proof and price as arguments
    }
    return [[], merkleProof]; // Empty Merkle Proof for other phases
  }, [currentPhase, merkleProof, getMintPrice]);

  

  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });




  return (
    <div>
      <button
        onClick={() => 
            writeContract({
                
                abi: CONTRACT_ABIS.MogSynthNFT, 
                address: CONTRACT_ADDRESS.anvil.MogSynthNFT as `0x${string}`,
        
                functionName: 'mint',
                args: mintArgs,
              })
        }
        disabled={!writeContract || isConfirming || currentPhase === Phase.Locked}
      >
        {isConfirming ? 'Minting...' : 'Mint Mog Synth'}
      </button>
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <p>MogSynth Mint Successful!</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default MintButton;
