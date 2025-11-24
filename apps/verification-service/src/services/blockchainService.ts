import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores, celo } from 'viem/chains';
import contractABI from '../config/contractABI.json';

// Define Celo Sepolia chain (not in viem by default)
const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  network: 'celo-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
    public: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'CeloScan',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
} as const;

export class BlockchainService {
  private static getChain() {
    const network = process.env.NETWORK || 'sepolia';

    switch (network.toLowerCase()) {
      case 'sepolia':
        return celoSepolia;
      case 'alfajores':
        return celoAlfajores;
      case 'mainnet':
      case 'celo':
        return celo;
      default:
        return celoSepolia;
    }
  }

  private static getContractAddress(): `0x${string}` {
    const network = process.env.NETWORK || 'sepolia';

    switch (network.toLowerCase()) {
      case 'sepolia':
        return (process.env.ORAH_REGISTRY_ADDRESS_SEPOLIA ||
          '0xd235B90dc929f7B061EAefdE0C8f020B3Cff47D7') as `0x${string}`;
      case 'alfajores':
        return process.env.ORAH_REGISTRY_ADDRESS_ALFAJORES as `0x${string}`;
      case 'mainnet':
      case 'celo':
        return process.env.ORAH_REGISTRY_ADDRESS_MAINNET as `0x${string}`;
      default:
        throw new Error(`Contract address not configured for network: ${network}`);
    }
  }

  private static getAccount() {
    const privateKey = process.env.BACKEND_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error(
        'BACKEND_PRIVATE_KEY not configured. Set this in .env to enable blockchain transactions.'
      );
    }

    if (!privateKey.startsWith('0x')) {
      throw new Error('BACKEND_PRIVATE_KEY must start with 0x');
    }

    return privateKeyToAccount(privateKey as `0x${string}`);
  }

  /**
   * Submit verification proof to smart contract
   */
  static async submitVerificationToBlockchain(
    batchId: string,
    proofHash: string
  ): Promise<{ transactionHash: string; blockNumber: bigint }> {
    try {
      const chain = this.getChain();
      const contractAddress = this.getContractAddress();
      const account = this.getAccount();

      console.log(`📝 Submitting verification to blockchain...`);
      console.log(`   Network: ${chain.name} (Chain ID: ${chain.id})`);
      console.log(`   Contract: ${contractAddress}`);
      console.log(`   Batch ID: ${batchId}`);
      console.log(`   Proof Hash: ${proofHash}`);

      // Create wallet client
      const walletClient = createWalletClient({
        account,
        chain,
        transport: http(),
      });

      // Create public client for reading
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      // Call verifyProof on smart contract
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'verifyProof',
        args: [batchId, proofHash],
      });

      console.log(`   Transaction Hash: ${hash}`);
      console.log(`   Waiting for confirmation...`);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log(`   ✅ Verified on blockchain!`);
      console.log(`   Block Number: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed}`);

      return {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('❌ Blockchain submission failed:', error);

      // Provide helpful error messages
      if (error.message?.includes('OwnableUnauthorizedAccount')) {
        throw new Error(
          'Backend wallet is not the contract owner. Only the contract owner can verify proofs.'
        );
      }

      if (error.message?.includes('Proof does not exist')) {
        throw new Error(
          `Batch ID "${batchId}" does not exist in the contract. The product must be registered first via the frontend.`
        );
      }

      throw new Error(`Blockchain error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if a proof is already verified on-chain
   */
  static async isProofVerified(batchId: string): Promise<boolean> {
    try {
      const chain = this.getChain();
      const contractAddress = this.getContractAddress();

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const isVerified = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'isProofVerified',
        args: [batchId],
      });

      return isVerified as boolean;
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      return false;
    }
  }

  /**
   * Get proof details from blockchain
   */
  static async getProof(batchId: string): Promise<any> {
    try {
      const chain = this.getChain();
      const contractAddress = this.getContractAddress();

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const proof = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getProof',
        args: [batchId],
      });

      return proof;
    } catch (error: any) {
      console.error('Error getting proof:', error);
      throw new Error(`Failed to get proof: ${error.message}`);
    }
  }

  /**
   * Get current network info
   */
  static getNetworkInfo() {
    const chain = this.getChain();
    const contractAddress = this.getContractAddress();

    return {
      network: chain.name,
      chainId: chain.id,
      contractAddress,
      rpcUrl: chain.rpcUrls.default.http[0],
      explorerUrl: chain.blockExplorers?.default.url,
    };
  }
}
