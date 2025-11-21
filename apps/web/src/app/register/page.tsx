"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrahRegistryAddress } from "@/config/contracts";
import OrahProofRegistryABI from "@/config/OrahProofRegistry.abi.json";
import QRCode from "react-qr-code";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const { address, isConnected, chain } = useAccount();
  const [batchId, setBatchId] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [producerName, setProducerName] = useState("");
  const [selfDID, setSelfDID] = useState(""); // Will integrate with Self Protocol later
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredBatchId, setRegisteredBatchId] = useState<string | null>(null);

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !chain) {
      alert("Please connect your wallet first");
      return;
    }

    if (!batchId || !productName || !origin || !producerName) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create metadata object
      const metadata = {
        batchId,
        productName,
        productDescription,
        origin,
        producerName,
        producerAddress: address,
        timestamp: new Date().toISOString(),
        // IoT data will be added later with NoahAI integration
      };

      // For now, we'll use a simple hash of the metadata as CID
      // TODO: Upload to IPFS and get real CID
      const metadataCID = `QmMock${Date.now()}`;

      // Use temporary DID until Self Protocol is integrated
      const tempSelfDID = selfDID || `did:temp:${address}`;

      // Get contract address for current network
      const contractAddress = getOrahRegistryAddress(chain.id);

      // Call smart contract
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: OrahProofRegistryABI,
        functionName: "createProof",
        args: [batchId, metadataCID, tempSelfDID],
        value: parseEther("1"), // 1 cUSD verification fee
      });
    } catch (err) {
      console.error("Error submitting proof:", err);
      alert("Failed to submit proof. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Handle success
  if (isSuccess && !registeredBatchId) {
    setRegisteredBatchId(batchId);
    setIsSubmitting(false);
  }

  // Show QR code after successful registration
  if (registeredBatchId) {
    const verificationUrl = `${window.location.origin}/verify/${registeredBatchId}`;

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <CardTitle className="text-2xl">Product Registered Successfully!</CardTitle>
            <CardDescription>Batch ID: {registeredBatchId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white p-6 rounded-lg flex justify-center">
              <QRCode value={verificationUrl} size={256} />
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code to verify product authenticity
              </p>
              <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                {verificationUrl}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Download QR code
                  const svg = document.querySelector("svg");
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `orah-${registeredBatchId}.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                  }
                }}
              >
                Download QR Code
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setRegisteredBatchId(null);
                  setBatchId("");
                  setProductName("");
                  setProductDescription("");
                  setOrigin("");
                  setProducerName("");
                  setSelfDID("");
                }}
              >
                Register Another Product
              </Button>
            </div>

            <Button
              variant="link"
              className="w-full"
              onClick={() => window.open(`/verify/${registeredBatchId}`, "_blank")}
            >
              View Proof Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Register Product Batch</CardTitle>
          <CardDescription>
            Create an immutable proof of origin for your products on the Celo blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-600 mb-4" />
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to register products
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Batch ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g., COFFEE-2024-001"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this product batch
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Organic Coffee Beans"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product Description</label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Origin / Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g., Kilimanjaro Region, Tanzania"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Producer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  placeholder="Your name or farm name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Self Protocol DID (Optional)
                </label>
                <input
                  type="text"
                  value={selfDID}
                  onChange={(e) => setSelfDID(e.target.value)}
                  placeholder="did:self:..."
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for now. Self Protocol integration coming soon.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-sm mb-2">Registration Fee</h3>
                <p className="text-2xl font-bold text-primary">1 cUSD</p>
                <p className="text-xs text-muted-foreground mt-1">
                  One-time verification fee paid to secure your proof on-chain
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    Error: {error.message}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isPending || isConfirming || isSubmitting}
              >
                {isPending || isConfirming || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isConfirming ? "Confirming..." : "Submitting..."}
                  </>
                ) : (
                  "Register Product & Pay 1 cUSD"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By registering, you agree that this information will be stored immutably on the
                Celo blockchain
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
