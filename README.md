# Orah - Proof of Origin Platform

<div align="center">

**Verify Product Origins From Soil to Shelf**

[![Built on Celo](https://img.shields.io/badge/Built%20on-Celo-FCFF52?style=flat&logo=celo)](https://celo.org)
[![Powered by Self Protocol](https://img.shields.io/badge/Powered%20by-Self%20Protocol-6B46C1?style=flat)](https://self.xyz)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Demo](https://orah.app) · [Documentation](https://docs.celo.org/build-on-celo/build-with-self) · [Report Bug](https://github.com/oderahub/Orah/issues)

</div>

## 🌍 Overview

Orah is a decentralized **Proof of Origin** platform that empowers farmers, artisans, and small producers to record, verify, and share the authentic story of their products. Built on **Celo blockchain**, Orah combines **blockchain immutability**, **AI verification (NoahAI)**, and **Zero-Knowledge Identity (Self Protocol)** to create tamper-proof authenticity proofs while preserving producer privacy.

### The Problem

- ❌ Consumers cannot verify sustainability or origin claims ("organic," "handmade," etc.)
- ❌ Small producers lack access to global trust systems
- ❌ Greenwashing, counterfeits, and data opacity persist in supply chains
- ❌ Emerging markets face barriers to premium market access

### Our Solution

Orah introduces a **verifiable Proof of Origin framework**:

1. **Identity Verification**: Producers verify via Self Protocol (zero-knowledge proofs)
2. **Data Collection**: IoT sensors + manual inputs logged
3. **AI Proof Agent (NoahAI)**: Validates & summarizes data into authenticity proofs
4. **On-chain Registry**: Smart contracts record proof hashes + metadata on Celo
5. **QR Verification**: Consumers scan codes in MiniPay to verify instantly

---

## ✨ Features

### ✅ Completed (Milestones 1, 3, 4)

#### 🔐 Blockchain Registry
- Immutable proof storage on Celo Sepolia testnet
- Smart contract: `OrahProofRegistry.sol` deployed at `0xd235B90dc929f7B061EAefdE0C8f020B3Cff47D7`
- Permanent on-chain storage with event emissions
- Verified on [Sourcify](https://repo.sourcify.dev/contracts/full_match/11142220/0xd235B90dc929f7B061EAefdE0C8f020B3Cff47D7/)

#### 📱 MiniPay Integration
- Auto-connect wallet support for MiniPay users
- Mobile-first responsive design
- cUSD native payments (1 cUSD registration fee)
- Progressive Web App optimized

#### 🔒 Self Protocol Identity Verification
- Privacy-preserving ZK identity proofs
- NFC passport/ID scanning (174+ countries)
- Age, nationality, and humanity verification
- Optional verification maintains flexibility

#### 📋 Product Registration
- Two-step registration flow
- Batch ID tracking and management
- Producer profile with verified identity
- QR code generation & download

#### 🔍 QR Verification System
- Camera-based QR scanner
- Manual batch ID entry
- Instant blockchain verification
- Trust indicators & proof details

#### 🎨 Modern UI/UX
- Next.js 14 + Tailwind CSS
- Responsive mobile design
- Dark mode compatible
- Accessible components

### 🚧 In Progress (Milestones 2, 5)

#### 🤖 NoahAI Integration
- AI verification agent for IoT data
- Automated data validation
- Proof narrative generation
- Hash generation for on-chain submission

#### 🚀 Production Deployment
- Mainnet deployment pending
- Pilot user onboarding
- Demo video production
- Analytics & monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Register   │  │     Scan     │  │    Verify    │      │
│  │   Products   │  │   QR Codes   │  │  Authenticity│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲ │
                            │ │ Wagmi + Reown AppKit
                            │ ▼
┌─────────────────────────────────────────────────────────────┐
│                   Wallet Layer (Celo)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MiniPay    │  │ WalletConnect│  │     Valora   │      │
│  │ (Auto-connect)│  │  (200+ wallets)│  │             │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲ │
                            │ │ cUSD Transactions
                            │ ▼
┌─────────────────────────────────────────────────────────────┐
│              Blockchain Layer (Celo Sepolia)                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │        OrahProofRegistry Smart Contract            │     │
│  │  • createProof()   • verifyProof()                 │     │
│  │  • getProof()      • getProducerBatches()          │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
        ▲                    ▲                    ▲
        │                    │                    │
┌───────┴───────┐    ┌──────┴──────┐    ┌────────┴────────┐
│ Self Protocol │    │   NoahAI    │    │      IPFS       │
│  ZK Identity  │    │ AI Validator│    │   Metadata      │
│ Verification  │    │   (Planned) │    │   Storage       │
└───────────────┘    └─────────────┘    └─────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Hooks + Wagmi
- **QR Codes**: react-qr-code, html5-qrcode

### Blockchain
- **Network**: Celo (Sepolia, Alfajores, Mainnet)
- **Smart Contracts**: Solidity 0.8.28
- **Development**: Hardhat + Ignition
- **Wallet**: Reown AppKit (WalletConnect)

### Identity & Privacy
- **Self Protocol**: @selfxyz/qrcode, @selfxyz/core
- **Zero-Knowledge**: ZK proofs for identity
- **NFC Scanning**: Passport/ID verification

### Storage
- **On-chain**: Proof hashes, DIDs, timestamps
- **Off-chain**: IPFS (metadata)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Git
- Celo wallet (MiniPay, Valora, or MetaMask)
- WalletConnect Project ID

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/oderahub/Orah.git
cd Orah

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.template apps/web/.env
cp apps/contracts/.env.example apps/contracts/.env

# Add your keys to .env files
# NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
# PRIVATE_KEY=your_wallet_private_key
\`\`\`

### Development

\`\`\`bash
# Start the development server
pnpm dev

# In another terminal, compile contracts
cd apps/contracts
pnpm compile

# Run tests
pnpm test

# Deploy contract to Sepolia testnet
pnpm deploy:sepolia
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Smart Contract Deployment

\`\`\`bash
cd apps/contracts

# Deploy to Celo Sepolia
npx hardhat ignition deploy ignition/modules/OrahProofRegistry.ts --network sepolia

# Verify on Blockscout
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "<FEE_RECIPIENT_ADDRESS>"
\`\`\`

---

## 📖 Usage

### For Producers (Farmers/Artisans)

1. **Connect Wallet**: Use MiniPay or any Celo-compatible wallet
2. **Verify Identity** (Optional): Scan your passport/ID with Self Protocol
3. **Register Product**: Fill in batch details, origin, and producer info
4. **Pay Fee**: Pay 1 cUSD to register proof on-chain
5. **Download QR**: Get your unique QR code for product packaging

### For Consumers

1. **Scan QR Code**: Use the /scan page or your phone camera
2. **View Proof**: See immutable blockchain proof
3. **Check Identity**: Verify if producer identity is authenticated
4. **Trust Indicators**: View verification status, origin, and timestamps

---

## 📊 Milestones & Progress

| Milestone | Description | Status | Completion |
|-----------|-------------|--------|------------|
| **M1: MiniPay Integration** | Mobile dApp with registration, scanning, and cUSD payments | ✅ Complete | 85% |
| **M2: MVP Launch** | Mainnet deployment, pilot users, demo video | 🚧 In Progress | 5% |
| **M3: Smart Contract** | OrahProofRegistry design, deployment, verification | ✅ Complete | 95% |
| **M4: Self Protocol** | ZK identity verification, privacy-preserving DIDs | ✅ Complete | 95% |
| **M5: NoahAI Agent** | AI verification for IoT data and proof generation | 📅 Planned | 0% |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Celo Foundation** - For grant support and ecosystem tools
- **Self Protocol** - For privacy-first identity verification
- **NoahAI** - For AI validation (integration in progress)
- **Reown (WalletConnect)** - For wallet infrastructure
- **Open-source community** - For amazing tools and libraries

---

## 📞 Contact & Links

- **Website**: [orah.app](https://orah.app)
- **GitHub**: [@oderahub](https://github.com/oderahub)
- **Twitter**: [@OrahProtocol](https://twitter.com/OrahProtocol)
- **Documentation**: [Celo Docs](https://docs.celo.org/build-on-celo/build-with-self)
- **Smart Contract**: [Blockscout](https://celo-sepolia.blockscout.com/address/0xd235B90dc929f7B061EAefdE0C8f020B3Cff47D7)

---

<div align="center">

**Built with ❤️ for a transparent, verifiable supply chain**

*Empowering producers, protecting consumers, preserving privacy*

</div>
