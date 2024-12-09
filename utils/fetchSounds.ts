// utils/fetchSounds.ts
import { ethers } from 'ethers';
import { CONTRACT_ABIS } from './contractABI';

/**
 * @notice Fetches all sounds from a given SoundLibrary contract.
 * @param libraryAddress The address of the SoundLibrary contract.
 * @param provider The ethers provider.
 * @returns An array of Sound objects containing data and bitDepth.
 */
export const fetchSounds = async (
  libraryAddress: string,
  provider: ethers.Provider
): Promise<{ data: string; bitDepth: number }[]> => {
  const contract = new ethers.Contract(
    libraryAddress,
    CONTRACT_ABIS.SoundLibrary,
    provider
  );

  const totalSounds: number = (await contract.getTotalSounds()).toNumber();
  const sounds: { data: string; bitDepth: number }[] = [];

  for (let i = 0; i < totalSounds; i++) {
    const soundData: string = await contract.getSound(i);
    const bitDepth: number = await contract.bitDepth();
    sounds.push({
      data: soundData,
      bitDepth: bitDepth,
    });
  }

  return sounds;
};
