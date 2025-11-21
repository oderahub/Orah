"use client";

import { useAppKit } from "@reown/appkit/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  const [isMinipay, setIsMinipay] = useState(false);
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    // @ts-ignore
    if (window.ethereum?.isMiniPay) {
      setIsMinipay(true);
    }
  }, []);

  // Don't show button in MiniPay as it auto-connects
  if (isMinipay) {
    return null;
  }

  return (
    <Button onClick={() => open()}>
      {isConnected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Connect Wallet"}
    </Button>
  );
}

// Export alias for compatibility
export { ConnectButton as WalletConnectButton };
