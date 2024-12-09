// utils/contractABI.ts
import {SoundLibraryABI} from '../abis/SoundLibrary';
import {LibraryFactoryABI} from '../abis/LibraryFactory';
import {MogSynthNFTABI}  from '../abis/MogSynthNFT';

export const CONTRACT_ADDRESS = {
  mainnet: {
    MogSynthNFT: '0xYourMainnetContractAddress', // Replace with actual mainnet address
      },
      sepolia: {
        MogSynthNFT: '0xYourSepoliaContractAddress', // Replace with actual sepolia address
      },
     anvil: {
    LibraryFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Replace with actual address
    MogSynthNFT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',       // Replace with actual address
  },
  // Add other networks if necessary
};

export const CONTRACT_ABIS = {
  SoundLibrary: SoundLibraryABI,
  LibraryFactory: LibraryFactoryABI,
  MogSynthNFT: MogSynthNFTABI,
};
