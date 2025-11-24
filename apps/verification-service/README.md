# Orah Verification Service (NoahAI)

Backend service for IoT data verification and blockchain proof generation.

## Overview

This service processes IoT sensor data from agricultural producers, validates authenticity using rule-based validation, and submits cryptographic proofs to the Orah smart contract on Celo blockchain.

## Features

- **IoT Data Ingestion**: REST API endpoints for receiving sensor data
- **Rule-Based Validation**: Temperature, humidity, GPS, and timestamp validation
- **Proof Generation**: SHA-256 hash generation for blockchain submission
- **Smart Contract Integration**: Automatic `verifyProof()` calls to OrahProofRegistry
- **API Key Authentication**: Secure access control for producers

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Blockchain**: Viem (Ethereum library)
- **Validation**: Zod schemas

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
pnpm dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Submit IoT Data for Verification
```
POST /api/verification/submit
Content-Type: application/json
X-API-Key: <your-api-key>

{
  "batchId": "COFFEE-2024-001",
  "producerAddress": "0x...",
  "iotData": [
    {
      "timestamp": "2024-11-24T10:00:00Z",
      "temperature": 23.5,
      "humidity": 45,
      "location": {
        "latitude": -3.0674,
        "longitude": 37.3556
      }
    }
  ]
}
```

### Get Verification Status
```
GET /api/verification/status/:batchId
```

## Validation Rules

### Temperature
- Range: -10°C to 50°C
- Validates against extreme values
- Checks for data consistency

### Humidity
- Range: 0% to 100%
- Validates realistic values
- Detects anomalies

### GPS Location
- Validates coordinate format
- Optional: Geographic bounds checking
- Consistency across readings

### Timestamps
- Must be in ISO 8601 format
- Cannot be in the future
- Sequential validation

## Deployment

Build for production:
```bash
pnpm build
pnpm start
```

## Environment Variables

See `.env.example` for required configuration.

## License

MIT
