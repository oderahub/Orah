"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualBatchId, setManualBatchId] = useState("");

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scanner.render(
        (decodedText) => {
          setScannedResult(decodedText);
          scanner.clear();
          setScanning(false);

          // Extract batch ID from URL or use direct batch ID
          if (decodedText.includes("/verify/")) {
            const batchId = decodedText.split("/verify/")[1];
            router.push(`/verify/${batchId}`);
          } else {
            // Assume it's a batch ID
            router.push(`/verify/${decodedText}`);
          }
        },
        (error) => {
          console.log("QR scan error:", error);
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [scanning, router]);

  const handleManualVerify = () => {
    if (manualBatchId.trim()) {
      router.push(`/verify/${manualBatchId.trim()}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle>Scan Product QR Code</CardTitle>
          <CardDescription>
            Verify product authenticity by scanning the QR code or entering the batch ID manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Scanner Section */}
          {!scanning ? (
            <div className="space-y-4">
              <Button
                className="w-full"
                size="lg"
                onClick={() => setScanning(true)}
              >
                <QrCode className="mr-2 h-5 w-5" />
                Start Camera Scanner
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or verify manually
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Enter Batch ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualBatchId}
                    onChange={(e) => setManualBatchId(e.target.value)}
                    placeholder="e.g., COFFEE-2024-001"
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleManualVerify();
                      }
                    }}
                  />
                  <Button
                    onClick={handleManualVerify}
                    disabled={!manualBatchId.trim()}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div id="qr-reader" className="w-full"></div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setScanning(false);
                }}
              >
                Cancel Scanning
              </Button>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-sm text-blue-900">How it Works</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Point your camera at the product's QR code</li>
              <li>Wait for automatic detection and scanning</li>
              <li>View the verified proof of origin instantly</li>
              <li>Check producer details and blockchain records</li>
            </ul>
          </div>

          {/* Example Products (for demo) */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-sm mb-3">Example Products (Demo)</h3>
            <div className="grid gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => router.push("/verify/DEMO-COFFEE-001")}
              >
                DEMO-COFFEE-001 - Organic Coffee Beans
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => router.push("/verify/DEMO-COCOA-001")}
              >
                DEMO-COCOA-001 - Fair Trade Cocoa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
