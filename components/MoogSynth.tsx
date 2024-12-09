import React, { useState, useRef, useEffect } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { Abi } from 'viem';
import { CONTRACT_ABIS } from '../utils/contractABI';

interface MoogSynthProps {
  libraryAddress: `0x${string}`;
}

const MoogSynth: React.FC<MoogSynthProps> = ({ libraryAddress }) => {
  const [sounds, setSounds] = useState<string[]>([]);
  const [bitDepth, setBitDepth] = useState<number>(16);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Validate the ABI as an `Abi` type
  const soundLibraryAbi = CONTRACT_ABIS.SoundLibrary as Abi;

  // Fetch bit depth from the contract
  const { data: bitDepthData } = useReadContract({
    address: libraryAddress,
    abi: soundLibraryAbi,
    functionName: 'bitDepth',
  });

  // Fetch total sounds from the contract
  const { data: totalSounds } = useReadContract({
    address: libraryAddress,
    abi: soundLibraryAbi,
    functionName: 'getTotalSounds',
  });

  // Fetch individual sound data
  const { data: soundsData } = useReadContracts({
    contracts: Array.from({ length: Number(totalSounds || 0) }, (_, index) => ({
      address: libraryAddress,
      abi: soundLibraryAbi,
      functionName: 'getSound',
      args: [index],
    })),
  });

  useEffect(() => {
    if (bitDepthData) {
      setBitDepth(Number(bitDepthData));
    }

    if (soundsData && Array.isArray(soundsData)) {
      // Extract successful results from soundsData
      const fetchedSounds = soundsData
        .filter((item) => item.status === 'success')
        .map((item) => item.result as string);
      setSounds(fetchedSounds);
    }

    setIsLoading(false);
  }, [bitDepthData, soundsData]);

  // Visualization logic using canvasRef
  const visualizeSound = (soundData: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const waveform = new Uint8Array(Buffer.from(soundData.slice(2), 'hex'));
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    waveform.forEach((value, index) => {
      const x = (index / waveform.length) * canvas.width;
      const y = (value / 255) * canvas.height;
      ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#00f';
    ctx.stroke();
  };

  return (
    <div>
      <h3>Moog Synth</h3>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Bit Depth: {bitDepth}</p>
          <h4>Available Sounds</h4>
          {sounds.length > 0 ? (
            <ul>
              {sounds.map((sound, index) => (
                <li key={index}>
                  <button onClick={() => visualizeSound(sound)}>
                    Play Sound {index + 1}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No sounds available.</p>
          )}
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            style={{ border: '1px solid #000', marginTop: '20px' }}
          />
        </div>
      )}
    </div>
  );
};

export default MoogSynth;
