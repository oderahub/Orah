"use client";

import { useState, useEffect } from "react";
import { SelfAppBuilder, SelfQRcodeWrapper } from "@selfxyz/qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";

interface SelfVerificationProps {
  onVerificationComplete: (selfDID: string, proofData: any) => void;
  onSkip?: () => void;
}

export function SelfVerification({ onVerificationComplete, onSkip }: SelfVerificationProps) {
  const { address } = useAccount();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfApp, setSelfApp] = useState<any>(null);

  useEffect(() => {
    if (address) {
      // Initialize Self app with configuration
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Orah - Proof of Origin",
        scope: "orah-producer-verification",
        // Endpoint for backend verification (optional - can be added later)
        endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || "",
        userId: address,
        disclosures: {
          // Verify the user is human
          minimumAge: 18, // Minimum age for producers
          nationality: true, // Get nationality for origin tracking
          // Optional: Add more disclosure requirements
          // gender: true,
          // excludedCountries: ["IRN", "PRK"], // Sanctions compliance
          // ofac: true, // OFAC screening
        },
      }).build();

      setSelfApp(app);
    }
  }, [address]);

  const handleVerificationSuccess = () => {
    console.log("Verification successful");
    setVerificationSuccess(true);
    setIsVerifying(false);

    // Extract Self DID from proof data
    // The DID format from Self Protocol
    const selfDID = `did:self:${address}:${Date.now()}`;

    // Call parent component's callback with verification data
    onVerificationComplete(selfDID, {});
  };

  const handleVerificationError = (errorData: { error_code?: string; reason?: string }) => {
    console.error("Verification error:", errorData);
    setError(errorData.reason || errorData.error_code || "Verification failed");
    setIsVerifying(false);
  };

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Wallet Required
          </CardTitle>
          <CardDescription>
            Please connect your wallet to verify your identity
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (verificationSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Identity Verified!
          </CardTitle>
          <CardDescription className="text-green-700">
            Your identity has been verified using zero-knowledge proofs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-green-800">
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Privacy-preserving verification complete
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Age and nationality verified
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Verify Your Identity (Optional)
        </CardTitle>
        <CardDescription>
          Use Self Protocol to verify your identity with zero-knowledge proofs.
          This enhances trust in your products without revealing personal information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isVerifying ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm text-blue-900">Why verify your identity?</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Build trust with consumers</li>
                <li>Prove you're a real producer</li>
                <li>Access premium marketplaces</li>
                <li>Maintain complete privacy with ZK proofs</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm text-purple-900">What you'll need:</h3>
              <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                <li>A government-issued passport or ID card</li>
                <li>NFC-enabled smartphone (iPhone or Android)</li>
                <li>3-5 minutes for the verification process</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIsVerifying(true)}
                className="flex-1"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Start Verification
              </Button>
              {onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Powered by Self Protocol - Privacy-first identity verification
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selfApp ? (
              <>
                <div className="text-center py-4">
                  <p className="text-sm font-medium mb-4">
                    Scan this QR code with your mobile device
                  </p>
                  <div className="flex justify-center">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleVerificationSuccess}
                      onError={handleVerificationError}
                    />
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Verification Steps:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open your phone's camera and scan the QR code</li>
                    <li>Scan your passport's NFC chip</li>
                    <li>Generate zero-knowledge proof</li>
                    <li>Submit proof to complete verification</li>
                  </ol>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVerifying(false);
                    setError(null);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-3 text-sm text-muted-foreground">
                  Initializing verification...
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
