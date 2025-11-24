import express, { Router } from 'express';
import { z } from 'zod';
import { VerificationService } from '../services/verificationService';
import { VerificationRequest } from '../types';
import { validateApiKey, optionalApiKey, storeApiKey } from '../middleware/auth';

const router: Router = express.Router();

// Zod schema for request validation
const IoTDataPointSchema = z.object({
  timestamp: z.string(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

const VerificationRequestSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
  producerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  iotData: z.array(IoTDataPointSchema).min(1, 'At least one IoT data point is required'),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/verification/submit
 * Submit IoT data for verification and proof generation
 */
router.post('/submit', async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = VerificationRequestSchema.parse(req.body);

    // Process verification
    const proofData = await VerificationService.processVerification(
      validatedData as VerificationRequest
    );

    // Get summary
    const summary = VerificationService.getValidationSummary(proofData);

    // Return response
    res.json({
      success: true,
      proofData: {
        batchId: proofData.batchId,
        proofHash: proofData.proofHash,
        iotDataHash: proofData.iotDataHash,
        timestamp: proofData.timestamp,
        validation: {
          isValid: summary.isValid,
          score: summary.score,
          errorCount: summary.errorCount,
          warningCount: summary.warningCount,
          summary: summary.summary,
          issues: proofData.validationResult.issues,
        },
      },
      message: summary.isValid
        ? 'IoT data verified successfully. Ready for blockchain submission.'
        : 'IoT data validation failed. Please review the issues.',
      nextSteps: summary.isValid
        ? [
            'Call the smart contract verifyProof() function with this proofHash',
            `Use the batchId: ${proofData.batchId}`,
            `Use the proofHash: ${proofData.proofHash}`,
          ]
        : ['Fix the validation errors and resubmit'],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
});

/**
 * POST /api/verification/submit-and-verify
 * Submit IoT data, validate, and automatically submit proof to blockchain
 * Requires API key authentication via X-API-Key header
 */
router.post('/submit-and-verify', optionalApiKey, async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = VerificationRequestSchema.parse(req.body);

    // Process verification
    const proofData = await VerificationService.processVerification(
      validatedData as VerificationRequest
    );

    // Get summary
    const summary = VerificationService.getValidationSummary(proofData);

    // If validation failed, return error
    if (!summary.isValid) {
      return res.status(400).json({
        success: false,
        error: 'IoT data validation failed',
        proofData: {
          batchId: proofData.batchId,
          validation: {
            isValid: summary.isValid,
            score: summary.score,
            errorCount: summary.errorCount,
            warningCount: summary.warningCount,
            summary: summary.summary,
            issues: proofData.validationResult.issues,
          },
        },
        message: 'Please fix validation errors before blockchain submission',
      });
    }

    // Import blockchain service
    const { BlockchainService } = await import('../services/blockchainService');

    // Check if already verified
    const isAlreadyVerified = await BlockchainService.isProofVerified(proofData.batchId);
    if (isAlreadyVerified) {
      return res.status(409).json({
        success: false,
        error: 'Batch already verified',
        message: `Batch ID "${proofData.batchId}" has already been verified on the blockchain`,
        batchId: proofData.batchId,
      });
    }

    // Submit to blockchain
    console.log('🚀 Submitting to blockchain...');
    const txResult = await BlockchainService.submitVerificationToBlockchain(
      proofData.batchId,
      proofData.proofHash
    );

    // Return success response
    res.json({
      success: true,
      proofData: {
        batchId: proofData.batchId,
        proofHash: proofData.proofHash,
        iotDataHash: proofData.iotDataHash,
        timestamp: proofData.timestamp,
        validation: {
          isValid: summary.isValid,
          score: summary.score,
          summary: summary.summary,
        },
      },
      blockchain: {
        transactionHash: txResult.transactionHash,
        blockNumber: txResult.blockNumber.toString(),
        network: BlockchainService.getNetworkInfo().network,
        explorerUrl: `${BlockchainService.getNetworkInfo().explorerUrl}/tx/${
          txResult.transactionHash
        }`,
      },
      message: 'IoT data verified and submitted to blockchain successfully! ✅',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error in submit-and-verify:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit verification to blockchain',
    });
  }
});

/**
 * GET /api/verification/status/:batchId
 * Get verification status for a batch from blockchain
 */
router.get('/status/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    // Import blockchain service
    const { BlockchainService } = await import('../services/blockchainService');

    // Check if verified
    const isVerified = await BlockchainService.isProofVerified(batchId);

    // Get proof details if exists
    let proofDetails = null;
    try {
      proofDetails = await BlockchainService.getProof(batchId);
    } catch (error) {
      // Proof doesn't exist
    }

    res.json({
      success: true,
      batchId,
      isVerified,
      proofDetails: proofDetails
        ? {
            batchId: proofDetails[0],
            metadataCID: proofDetails[1],
            selfDID: proofDetails[2],
            producer: proofDetails[3],
            timestamp: proofDetails[4].toString(),
            verified: proofDetails[5],
            proofHash: proofDetails[6],
            verificationFee: proofDetails[7].toString(),
          }
        : null,
      network: BlockchainService.getNetworkInfo(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get verification status',
    });
  }
});

/**
 * POST /api/verification/generate-api-key
 * Generate an API key for a producer
 */
router.post('/generate-api-key', async (req, res) => {
  try {
    const { producerAddress } = req.body;

    if (!producerAddress || !/^0x[a-fA-F0-9]{40}$/.test(producerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Valid Ethereum address required',
      });
    }

    // Import here to avoid circular dependency
    const { ProofGenerator } = await import('../utils/proofGenerator');
    const apiKey = ProofGenerator.generateApiKey(producerAddress);
    const createdAt = new Date().toISOString();

    // Store API key
    storeApiKey(apiKey, producerAddress, createdAt);

    res.json({
      success: true,
      apiKey,
      producerAddress,
      message: 'Store this API key securely. It cannot be recovered.',
      createdAt,
      usage: 'Include this key in the X-API-Key header when making requests',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
    });
  }
});

export default router;
