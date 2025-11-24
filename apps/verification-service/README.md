# Orah Verification Service (NoahAI)

🤖 **Milestone 5 Implementation** - AI Agent & IoT Proof Layer

Backend service for IoT data verification and blockchain proof generation.

## Overview

This service processes IoT sensor data from agricultural producers, validates authenticity using rule-based AI validation, and automatically submits cryptographic proofs to the Orah smart contract on Celo blockchain.

**Key Features:**
- Rule-based IoT data validation (temperature, humidity, GPS, timestamps)
- SHA-256 cryptographic proof generation
- Automatic blockchain submission via smart contract integration
- API key authentication for secure access
- Real-time verification status queries

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
- Warns for unusual agricultural temperatures
- Checks for data consistency

### Humidity
- Range: 0% to 100%
- Validates realistic values
- Detects anomalies

### GPS Location
- Validates coordinate format
- Optional: Geographic bounds checking (configurable via .env)
- Consistency across readings (detects movement > 100km)

### Timestamps
- Must be in ISO 8601 format
- Cannot be in the future
- Warns for data older than 1 year
- Sequential validation

### Scoring System
- Each data point starts at 100/100
- Errors deduct 10 points
- Warnings deduct 5 points
- Minimum passing score: 60/100
- Validation fails if score < 60 or any errors exist

## Usage Example

### 1. Generate API Key

```bash
curl -X POST http://localhost:3001/api/verification/generate-api-key \
  -H "Content-Type: application/json" \
  -d '{"producerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"}'
```

Response:
```json
{
  "success": true,
  "apiKey": "a1b2c3d4e5f6...",
  "producerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "message": "Store this API key securely. It cannot be recovered.",
  "createdAt": "2024-11-24T10:00:00Z",
  "usage": "Include this key in the X-API-Key header when making requests"
}
```

### 2. Submit IoT Data and Auto-Verify

```bash
curl -X POST http://localhost:3001/api/verification/submit-and-verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "batchId": "COFFEE-2024-001",
    "producerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "iotData": [
      {
        "timestamp": "2024-11-24T08:00:00Z",
        "temperature": 23.5,
        "humidity": 45,
        "location": {
          "latitude": -3.0674,
          "longitude": 37.3556
        }
      },
      {
        "timestamp": "2024-11-24T09:00:00Z",
        "temperature": 24.1,
        "humidity": 46,
        "location": {
          "latitude": -3.0674,
          "longitude": 37.3556
        }
      }
    ],
    "metadata": {
      "productName": "Organic Coffee Beans",
      "origin": "Kilimanjaro, Tanzania"
    }
  }'
```

Response:
```json
{
  "success": true,
  "proofData": {
    "batchId": "COFFEE-2024-001",
    "proofHash": "a1b2c3d4e5f6789...",
    "iotDataHash": "9f8e7d6c5b4a3...",
    "timestamp": "2024-11-24T10:15:00Z",
    "validation": {
      "isValid": true,
      "score": 100,
      "summary": "Validation passed successfully. Score: 100/100"
    }
  },
  "blockchain": {
    "transactionHash": "0xabc123...",
    "blockNumber": "12345678",
    "network": "Celo Sepolia Testnet",
    "explorerUrl": "https://celo-sepolia.blockscout.com/tx/0xabc123..."
  },
  "message": "IoT data verified and submitted to blockchain successfully! ✅"
}
```

### 3. Check Verification Status

```bash
curl http://localhost:3001/api/verification/status/COFFEE-2024-001
```

Response:
```json
{
  "success": true,
  "batchId": "COFFEE-2024-001",
  "isVerified": true,
  "proofDetails": {
    "batchId": "COFFEE-2024-001",
    "metadataCID": "QmMock1732444800000",
    "selfDID": "did:temp:0x742d35Cc...",
    "producer": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "timestamp": "1732444800",
    "verified": true,
    "proofHash": "a1b2c3d4e5f6789...",
    "verificationFee": "1000000000000000000"
  },
  "network": {
    "network": "Celo Sepolia Testnet",
    "chainId": 11142220,
    "contractAddress": "0xd235B90dc929f7B061EAefdE0C8f020B3Cff47D7",
    "rpcUrl": "https://forno.celo-sepolia.celo-testnet.org",
    "explorerUrl": "https://celo-sepolia.blockscout.com"
  }
}
```

## Integration Workflow

```
┌─────────────┐
│ IoT Sensors │ (Temperature, Humidity, GPS)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/verification/submit-and-verify│
│  - Validate API Key                      │
│  - Parse IoT Data                        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Rule-Based Validation Engine           │
│  - Temperature: -10°C to 50°C           │
│  - Humidity: 0% to 100%                  │
│  - GPS: Valid coordinates                │
│  - Timestamps: ISO 8601, not future      │
│  - Consistency checks                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Proof Generation (SHA-256)             │
│  - IoT Data Hash                         │
│  - Validation Result Hash                │
│  - Combined Proof Hash                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Smart Contract Integration (Viem)      │
│  - Call verifyProof(batchId, hash)      │
│  - Wait for transaction confirmation     │
│  - Emit ProofVerified event              │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Response with Transaction Hash         │
│  - Proof hash for on-chain storage       │
│  - Block number and explorer link        │
└─────────────────────────────────────────┘
```

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
