export interface IoTDataPoint {
  timestamp: string; // ISO 8601 format
  temperature?: number; // Celsius
  humidity?: number; // Percentage
  location?: {
    latitude: number;
    longitude: number;
  };
  [key: string]: any; // Allow additional sensor data
}

export interface VerificationRequest {
  batchId: string;
  producerAddress: string;
  iotData: IoTDataPoint[];
  metadata?: {
    productName?: string;
    origin?: string;
    [key: string]: any;
  };
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  summary: string;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  value?: any;
}

export interface ProofData {
  batchId: string;
  validationResult: ValidationResult;
  proofHash: string; // SHA-256 hash of validation data
  timestamp: string;
  iotDataHash: string; // Hash of raw IoT data
}

export interface VerificationResponse {
  success: boolean;
  proofData?: ProofData;
  transactionHash?: string;
  error?: string;
}

export interface ApiKeyData {
  key: string;
  producerAddress: string;
  createdAt: string;
  active: boolean;
}
