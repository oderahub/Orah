import { Request, Response, NextFunction } from 'express';
import { ProofGenerator } from '../utils/proofGenerator';

// Simple in-memory store for API keys (in production, use a database)
// Format: { hashedKey: { producerAddress, createdAt, active } }
const apiKeyStore = new Map<
  string,
  { producerAddress: string; createdAt: string; active: boolean }
>();

/**
 * Middleware to validate API key from X-API-Key header
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide an API key in the X-API-Key header',
    });
  }

  // Hash the provided API key
  const hashedKey = ProofGenerator.hashApiKey(apiKey);

  // Check if API key exists and is active
  const keyData = apiKeyStore.get(hashedKey);

  if (!keyData || !keyData.active) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or inactive API key',
      message: 'The provided API key is not valid or has been deactivated',
    });
  }

  // Attach producer address to request for use in routes
  (req as any).producerAddress = keyData.producerAddress;

  next();
}

/**
 * Optional middleware - only validates API key if provided
 */
export function optionalApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (apiKey) {
    const hashedKey = ProofGenerator.hashApiKey(apiKey);
    const keyData = apiKeyStore.get(hashedKey);

    if (keyData && keyData.active) {
      (req as any).producerAddress = keyData.producerAddress;
    }
  }

  next();
}

/**
 * Store an API key (called when generating new keys)
 */
export function storeApiKey(
  apiKey: string,
  producerAddress: string,
  createdAt: string = new Date().toISOString()
) {
  const hashedKey = ProofGenerator.hashApiKey(apiKey);

  apiKeyStore.set(hashedKey, {
    producerAddress,
    createdAt,
    active: true,
  });

  console.log(`✅ API key stored for producer: ${producerAddress}`);
}

/**
 * Revoke an API key
 */
export function revokeApiKey(apiKey: string): boolean {
  const hashedKey = ProofGenerator.hashApiKey(apiKey);
  const keyData = apiKeyStore.get(hashedKey);

  if (!keyData) {
    return false;
  }

  keyData.active = false;
  apiKeyStore.set(hashedKey, keyData);
  console.log(`🔒 API key revoked for producer: ${keyData.producerAddress}`);

  return true;
}

/**
 * Get all API keys (for admin purposes)
 * Returns only metadata, not the actual keys
 */
export function getAllApiKeys() {
  const keys: Array<{
    producerAddress: string;
    createdAt: string;
    active: boolean;
  }> = [];

  apiKeyStore.forEach((value) => {
    keys.push(value);
  });

  return keys;
}
