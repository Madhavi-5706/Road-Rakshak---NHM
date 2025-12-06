// Mock Security Service for Blockchain Simulation and Data Encryption

// Simple simulated hash function for the "blockchain" logs
// Includes fallback for environments where crypto.subtle is unavailable (e.g. non-HTTPS localhost)
export const generateHash = async (message: string): Promise<string> => {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      throw new Error("Crypto API unavailable");
    }
  } catch (e) {
    // Fallback simple hash for compatibility
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const val = Math.abs(hash).toString(16);
    return val.padStart(64, '0'); // Pad to simulate SHA-256 length
  }
};

// Generate a random "Wallet" address for DID (Decentralized Identifier)
export const generateDID = (): string => {
  try {
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    const address = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `0x${address}`;
  } catch (e) {
    // Fallback for random generation
    const randomHex = Math.random().toString(16).substring(2, 15) + Math.random().toString(16).substring(2, 15);
    return `0x${randomHex.padEnd(40, '0')}`;
  }
};

// Simulated AES Encryption for localStorage (Obfuscation for demo)
// This prevents simple XSS scraping of cleartext logs
export const encryptData = (data: string): string => {
  try {
    return btoa(encodeURIComponent(data).split('').reverse().join(''));
  } catch (e) {
    return data;
  }
};

export const decryptData = (data: string): string => {
  try {
    return decodeURIComponent(atob(data).split('').reverse().join(''));
  } catch (e) {
    console.warn("Failed to decrypt data, returning raw", e);
    return data;
  }
};

// Input Sanitization to prevent Injection Attacks
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return input.replace(/[<>&"']/g, (match) => {
    switch (match) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return match;
    }
  });
};
