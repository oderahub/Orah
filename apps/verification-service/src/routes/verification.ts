import express from 'express';
import { z } from 'zod';
import { VerificationService } from '../services/verificationService';
import { VerificationRequest } from '../types';

const router = express.Router();

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
 * GET /api/verification/status/:batchId
 * Get verification status for a batch
 * Note: In a production system, you'd store proof data in a database
 */
router.get('/status/:batchId', async (req, res) => {
  const { batchId } = req.params;

  // TODO: Implement database lookup
  res.json({
    success: false,
    message: 'Status lookup not yet implemented. Store proof data in a database for persistence.',
    batchId,
  });
});

/**
 * POST /api/verification/generate-api-key
 * Generate an API key for a producer
 * Note: In production, implement proper authentication and store keys in database
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

    res.json({
      success: true,
      apiKey,
      producerAddress,
      message: 'Store this API key securely. It cannot be recovered.',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
    });
  }
});

export default router;
