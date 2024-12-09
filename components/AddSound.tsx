import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ABIS } from '@/utils/contractABI';
import pako from 'pako'; // Import pako for compression

interface AddSoundProps {
  libraryAddress: `0x${string}`;
}

const AddSound: React.FC<AddSoundProps> = ({ libraryAddress }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: hash, writeContract } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('Please select a file.');
      return;
    }

    if (file.size > 1024) {
      setStatus('File size exceeds 1KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as ArrayBuffer;
        const inputBytes = new Uint8Array(result);

        // Compress the input bytes
        const compressed = pako.deflate(inputBytes);

        // Convert compressed data to hex
        const hexData = '0x' + Buffer.from(compressed).toString('hex');

        writeContract({
          abi: CONTRACT_ABIS.SoundLibrary,
          address: libraryAddress,
          functionName: 'addSound',
          args: [hexData],
        });

        setStatus('Sound is being added...');
      } catch (compressionError: unknown) {
        console.error('Compression failed:', compressionError);
        setError('Failed to compress file.');
      }
    };

    reader.onerror = () => {
      setError('Failed to read file.');
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h3>Add New Sound</h3>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".wav,.raw" onChange={handleFileChange} />
        <button type="submit" disabled={!writeContract || isLoading}>
          {isLoading ? 'Adding Sound...' : 'Add Sound'}
        </button>
      </form>
      {isSuccess && <p>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddSound;