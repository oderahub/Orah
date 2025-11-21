"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useReadContract, useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrahRegistryAddress } from "@/config/contracts";
import OrahProofRegistryABI from "@/config/OrahProofRegistry.abi.json";
import { CheckCircle2, XCircle, Loader2, ExternalLink, MapPin, User, Package, Calendar } from "lucide-react";

interface ProofData {
  batchId: string;
  metadataCID: string;
  selfDID: string;
  producer: string;
  timestamp: bigint;
  verified: boolean;
  proofHash: string;
  verificationFee: bigint;
}

export default function VerifyPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const { batchId } = resolvedParams;
  const { chain } = useAccount();
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  useEffect(() => {
    // Default to Sepolia if no chain is connected
    const chainId = chain?.id || 11142220;
    try {
      const address = getOrahRegistryAddress(chainId);
      setContractAddress(address);
    } catch (err) {
      console.error("Failed to get contract address:", err);
    }
  }, [chain]);

  const {
    data: proofData,
    isError,
    isLoading,
    error,
  } = useReadContract({
    address: contractAddress as `0x${string}` | undefined,
    abi: OrahProofRegistryABI,
    functionName: "getProof",
    args: [batchId],
    query: {
      enabled: !!contractAddress && !!batchId,
    },
  });

  const proof = proofData as ProofData | undefined;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying product authenticity...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !proof) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
            <CardTitle className="text-2xl">Product Not Found</CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-red-600">
                  {error.message || "This product is not registered in our system"}
                </span>
              ) : (
                "This product is not registered in our system"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This product may not be authentic or its proof of origin
                has not been registered on the blockchain.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Searched for:</p>
              <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                Batch ID: {batchId}
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timestamp = new Date(Number(proof.timestamp) * 1000);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <CardTitle className="text-2xl">Authentic Product Verified</CardTitle>
          <CardDescription>
            This product has been verified on the Celo blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verification Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">Blockchain Verified</h3>
                <p className="text-sm text-green-700">
                  {proof.verified ? "AI Verified" : "Pending AI Verification"}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Product Information</h3>

            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batch ID</p>
                  <p className="font-mono text-sm">{proof.batchId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Producer Address</p>
                  <p className="font-mono text-xs break-all">{proof.producer}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                  <p className="text-sm">{timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Metadata CID</p>
                  <p className="font-mono text-xs break-all">{proof.metadataCID}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full product details stored on IPFS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Self Protocol Identity */}
          {proof.selfDID && !proof.selfDID.includes("temp") && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Verified Identity</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-mono break-all">{proof.selfDID}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Producer identity verified via Self Protocol (Zero-Knowledge)
                </p>
              </div>
            </div>
          )}

          {/* AI Verification Status */}
          {proof.verified && proof.proofHash && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">NoahAI Verification</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-900 mb-1">
                  AI Validation Complete
                </p>
                <p className="text-xs font-mono break-all text-purple-700">
                  Hash: {proof.proofHash}
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  This product's origin data has been validated by NoahAI
                </p>
              </div>
            </div>
          )}

          {/* Blockchain Explorer Link */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const explorerUrl = chain?.blockExplorers?.default?.url || "https://celo-sepolia.blockscout.com";
                window.open(`${explorerUrl}/address/${contractAddress}`, "_blank");
              }}
            >
              View on Blockchain Explorer
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-3">Trust Indicators</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Blockchain</p>
                <p className="font-medium">Celo (Immutable)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Verification Fee</p>
                <p className="font-medium">{(Number(proof.verificationFee) / 1e18).toFixed(2)} cUSD</p>
              </div>
              <div>
                <p className="text-muted-foreground">Network</p>
                <p className="font-medium">{chain?.name || "Celo Sepolia"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-green-600">Verified</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: `Orah - Verified Product: ${proof.batchId}`,
                    text: "This product's origin has been verified on the Celo blockchain",
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
            >
              Share Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
