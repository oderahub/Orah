/**
 * Smart Contract Addresses for Orah
 * Updated: 2025-11-21
 */

export const CONTRACTS = {
  // OrahProofRegistry contract addresses by network
  ORAH_PROOF_REGISTRY: {
    // Celo Sepolia Testnet (Chain ID: 11142220)
    11142220: "0xd235B90dc929f7B061EAefdE0C8f020B3Cff47D7",

    // Celo Alfajores Testnet (Chain ID: 44787)
    44787: "", // Deploy here later if needed

    // Celo Mainnet (Chain ID: 42220)
    42220: "", // Deploy to mainnet when ready for production
  },
} as const;

/**
 * Get the OrahProofRegistry contract address for the current network
 */
export function getOrahRegistryAddress(chainId: number): string {
  const address = CONTRACTS.ORAH_PROOF_REGISTRY[chainId as keyof typeof CONTRACTS.ORAH_PROOF_REGISTRY];

  if (!address) {
    throw new Error(`OrahProofRegistry not deployed on chain ${chainId}`);
  }

  return address;
}

// Network details
export const SUPPORTED_NETWORKS = {
  SEPOLIA: {
    chainId: 11142220,
    name: "Celo Sepolia",
    rpcUrl: "https://forno.celo-sepolia.celo-testnet.org",
    blockExplorer: "https://celo-sepolia.blockscout.com",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
  },
  ALFAJORES: {
    chainId: 44787,
    name: "Celo Alfajores",
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
  },
  MAINNET: {
    chainId: 42220,
    name: "Celo",
    rpcUrl: "https://forno.celo.org",
    blockExplorer: "https://celoscan.io",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
  },
} as const;
