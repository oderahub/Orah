import { ValidationRules } from '../utils/validation';
import { ProofGenerator } from '../utils/proofGenerator';
import { VerificationRequest, ProofData } from '../types';

export class VerificationService {
  /**
   * Process IoT data and generate verification proof
   */
  static async processVerification(request: VerificationRequest): Promise<ProofData> {
    // Step 1: Validate IoT data using rule-based validation
    console.log(`Processing verification for batch: ${request.batchId}`);
    const validationResult = ValidationRules.validateIoTData(request.iotData);

    console.log(`Validation result: ${validationResult.summary}`);
    console.log(`Score: ${validationResult.score}/100`);
    console.log(`Issues found: ${validationResult.issues.length}`);

    // Step 2: Generate proof data with hashes
    const proofData = ProofGenerator.generateProofData(
      request.batchId,
      request.iotData,
      validationResult
    );

    console.log(`Generated proof hash: ${proofData.proofHash}`);
    console.log(`IoT data hash: ${proofData.iotDataHash}`);

    return proofData;
  }

  /**
   * Get validation status summary
   */
  static getValidationSummary(proofData: ProofData): {
    isValid: boolean;
    score: number;
    errorCount: number;
    warningCount: number;
    summary: string;
  } {
    const { validationResult } = proofData;
    const errorCount = validationResult.issues.filter(i => i.severity === 'error').length;
    const warningCount = validationResult.issues.filter(i => i.severity === 'warning').length;

    return {
      isValid: validationResult.isValid,
      score: validationResult.score,
      errorCount,
      warningCount,
      summary: validationResult.summary,
    };
  }
}
