// // components/CreateLibrary.tsx
// import React, { useState, useMemo } from 'react';
// import { useWriteContract, useWaitForTransactionReceipt, useAccount, useNetwork } from 'wagmi';
// import { CONTRACT_ABIS, CONTRACT_ADDRESS } from '@/utils/contractABI';
// import { ethers } from 'ethers';

// enum Phase {
//   Locked,
//   Presale,
//   Whitelist,
//   Public,
// }



// const CreateLibrary: React.FC = () => {
//   const { address, isConnected } = useAccount();
//   const { chain } = useNetwork();

//   const [ownerAddress, setOwnerAddress] = useState<string>(address || '');
//   const [bitDepth, setBitDepth] = useState<number>(16);
//   const [maxSamples, setMaxSamples] = useState<number>(1000);
//   const [status, setStatus] = useState<string>('');
//   const [error, setError] = useState<string | null>(null);

//   // Determine the correct contract address based on the connected chain
//   const contractAddress = useMemo(() => {
//     if (chain?.id === 31337) { // Anvil Localhost
//       return CONTRACT_ADDRESS.anvil.MogSynthNFT as `0x${string}`;
//     } else if (chain?.id === 1) { // Ethereum Mainnet
//       return CONTRACT_ADDRESS.mainnet.MogSynthNFT as `0x${string}`;
//     } else if (chain?.id === 11155111) { // Sepolia Testnet
//       return CONTRACT_ADDRESS.sepolia.MogSynthNFT as `0x${string}`;
//     } else {
//       return ''; // Unsupported network
//     }
//   }, [chain]);

//   // Validate if the connected user is the contract owner
//   // Assuming your contract has an `owner()` function
//   const { data: contractOwner, isError: ownerError, isLoading: ownerLoading } = useReadContract({
//     abi: CONTRACT_ABIS.MogSynthNFT,
//     address: contractAddress,
//     functionName: 'owner',
//     args: [],
//     query: {
//       enabled: isConnected && Boolean(contractAddress),
//     },
//   });

//   const isOwner = useMemo(() => {
//     if (contractOwner && address) {
//       return (contractOwner as string).toLowerCase() === address.toLowerCase();
//     }
//     return false;
//   }, [contractOwner, address]);

//   // Setup the write contract function
//   const { data: txHash, writeContract: createLibraryContract } = useWriteContract({
//     abi: CONTRACT_ABIS.MogSynthNFT,
//     address: contractAddress,
//     functionName: 'createLibrary',
//     args: [ownerAddress, bitDepth, maxSamples],
//     onError(error) {
//       console.error('Error creating library:', error);
//       setError(error.message);
//     },
//     onSuccess() {
//       setStatus('Library creation transaction sent.');
//     },
//   });

//   // Wait for the transaction receipt
//   const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
//     hash: txHash,
//   });

//   // Handle form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Input validations
//     if (!ethers.utils.isAddress(ownerAddress)) {
//       setError('Invalid owner address.');
//       return;
//     }

//     if (![8, 16].includes(bitDepth)) {
//       setError('Bit depth must be either 8 or 16.');
//       return;
//     }

//     if (maxSamples <= 0) {
//       setError('Max samples must be a positive number.');
//       return;
//     }

//     // Clear previous errors and status
//     setError(null);
//     setStatus('Sending transaction...');

//     // Call the contract
//     createLibraryContract?.();
//   };

//   // Update owner address if connected and no manual input
//   React.useEffect(() => {
//     if (isConnected && address && (!ownerAddress || ownerAddress === '')) {
//       setOwnerAddress(address);
//     }
//   }, [isConnected, address, ownerAddress]);

//   // Handle transaction success
//   React.useEffect(() => {
//     if (isSuccess) {
//       setStatus('SoundLibrary created successfully!');
//       // Optionally, reset the form
//       setOwnerAddress(address || '');
//       setBitDepth(16);
//       setMaxSamples(1000);
//     }
//   }, [isSuccess, address]);

//   return (
//     <div style={{
//       marginTop: '20px',
//       border: '1px solid #ccc',
//       borderRadius: '10px',
//       padding: '20px',
//       maxWidth: '500px',
//       margin: '20px auto',
//       background: '#f9f9f9',
//       textAlign: 'left'
//     }}>
//       <h3>Create New SoundLibrary</h3>

//       {!isConnected && (
//         <p style={{ color: 'red' }}>Please connect your wallet to use this feature.</p>
//       )}

//       {isConnected && !isOwner && (
//         <p style={{ color: 'red' }}>Only the contract owner can create a SoundLibrary.</p>
//       )}

//       {isConnected && isOwner && (
//         <form onSubmit={handleSubmit}>
//           <div style={{ marginBottom: '10px' }}>
//             <label htmlFor="ownerAddress">Owner Address:</label><br />
//             <input
//               type="text"
//               id="ownerAddress"
//               value={ownerAddress}
//               onChange={(e) => setOwnerAddress(e.target.value)}
//               placeholder="0x..."
//               style={{ width: '100%', padding: '8px' }}
//               required
//             />
//           </div>

//           <div style={{ marginBottom: '10px' }}>
//             <label htmlFor="bitDepth">Bit Depth:</label><br />
//             <select
//               id="bitDepth"
//               value={bitDepth}
//               onChange={(e) => setBitDepth(Number(e.target.value))}
//               style={{ width: '100%', padding: '8px' }}
//               required
//             >
//               <option value={8}>8-bit</option>
//               <option value={16}>16-bit</option>
//             </select>
//           </div>

//           <div style={{ marginBottom: '10px' }}>
//             <label htmlFor="maxSamples">Max Samples:</label><br />
//             <input
//               type="number"
//               id="maxSamples"
//               value={maxSamples}
//               onChange={(e) => setMaxSamples(Number(e.target.value))}
//               min={1}
//               style={{ width: '100%', padding: '8px' }}
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={!createLibraryContract || isConfirming}
//             style={{
//               backgroundColor: '#4CAF50',
//               color: 'white',
//               padding: '10px 15px',
//               borderRadius: '5px',
//               border: 'none',
//               cursor: 'pointer',
//               width: '100%',
//               opacity: (!createLibraryContract || isConfirming) ? 0.6 : 1,
//             }}
//           >
//             {isConfirming ? 'Creating Library...' : 'Create SoundLibrary'}
//           </button>
//         </form>
//       )}

//       {status && (
//         <p style={{ color: isSuccess ? 'green' : 'black', marginTop: '10px' }}>
//           {status}
//         </p>
//       )}

//       {error && (
//         <p style={{ color: 'red', marginTop: '10px' }}>
//           {error}
//         </p>
//       )}
//     </div>
//   );
// };

// export default CreateLibrary;
