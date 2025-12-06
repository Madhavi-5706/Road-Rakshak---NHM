import { ActivityLog } from '../types';
import { generateHash, encryptData, decryptData } from './securityService';

const STORAGE_KEY = 'roadguard_secure_ledger';

export interface BlockLog extends ActivityLog {
  previousHash: string;
  hash: string;
  signature: string; // Mock signature
}

let memoryChain: BlockLog[] = [];

// Initialize chain from storage
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const decrypted = decryptData(stored);
    memoryChain = JSON.parse(decrypted);
  }
} catch (e) {
  console.error("Ledger integrity compromised or empty. Starting new chain.");
  memoryChain = [];
}

export const addLog = async (action: string, details: string, status: 'SUCCESS' | 'ERROR' | 'INFO' = 'INFO', userId: string = 'SYSTEM'): Promise<BlockLog> => {
  
  // 1. Get previous block's hash (Blockchain Link)
  const previousBlock = memoryChain.length > 0 ? memoryChain[0] : null;
  const previousHash = previousBlock ? previousBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';
  
  const timestamp = Date.now();
  
  // 2. Create data payload
  const logData = `${previousHash}-${timestamp}-${action}-${details}-${userId}`;
  
  // 3. Mine/Hash the block
  const currentHash = await generateHash(logData);

  const newBlock: BlockLog = {
    id: currentHash.substring(0, 12), // Use hash fragment as ID
    timestamp,
    action,
    details,
    status,
    previousHash,
    hash: currentHash,
    signature: `SIGNED_BY_${userId}`
  };

  // 4. Add to chain (Front of array for display)
  memoryChain = [newBlock, ...memoryChain].slice(0, 50);

  // 5. Encrypt and Persist
  try {
    const encryptedChain = encryptData(JSON.stringify(memoryChain));
    localStorage.setItem(STORAGE_KEY, encryptedChain);
  } catch (e) {
    console.error("Failed to persist secure ledger", e);
  }
  
  return newBlock;
};

export const getLogs = (): BlockLog[] => {
  return memoryChain;
};

export const clearLogs = () => {
  memoryChain = [];
  localStorage.removeItem(STORAGE_KEY);
};
