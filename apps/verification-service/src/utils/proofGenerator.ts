import crypto from 'crypto';
import { IoTDataPoint, ValidationResult, ProofData } from '../types';

export class ProofGenerator {
  /**
   * Generate a SHA-256 hash from IoT data
   */
  static generateIoTDataHash(iotData: IoTDataPoint[]): string {
    const dataString = JSON.stringify(iotData, Object.keys(iotData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate a verification proof hash that will be stored on-chain
   * This combines validation result and IoT data hash
   */
  static generateProofHash(
    batchId: string,
    validationResult: ValidationResult,
    iotDataHash: string
  ): string {
    const proofData = {
      batchId,
      isValid: validationResult.isValid,
      score: validationResult.score,
      iotDataHash,
      timestamp: new Date().toISOString(),
    };

    const proofString = JSON.stringify(proofData, Object.keys(proofData).sort());
    return crypto.createHash('sha256').update(proofString).digest('hex');
  }

  /**
   * Generate complete proof data structure
   */
  static generateProofData(
    batchId: string,
    iotData: IoTDataPoint[],
    validationResult: ValidationResult
  ): ProofData {
    const iotDataHash = this.generateIoTDataHash(iotData);
    const proofHash = this.generateProofHash(batchId, validationResult, iotDataHash);

    return {
      batchId,
      validationResult,
      proofHash,
      timestamp: new Date().toISOString(),
      iotDataHash,
    };
  }

  /**
   * Generate a unique API key for a producer
   */
  static generateApiKey(producerAddress: string): string {
    const randomBytes = crypto.randomBytes(32);
    const dataToHash = `${producerAddress}-${randomBytes.toString('hex')}-${Date.now()}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Verify an API key (basic implementation)
   * In production, you'd want to store these in a database
   */
  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}
