"use client"

import { Toaster } from "@/components/ui/toaster"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"
import { MoongateWalletAdapter } from "@moongate/moongate-adapter"
export const Wallet = ({ children }: { children: any }) => {
  const wallets = [
    new MoongateWalletAdapter(),
    new UnsafeBurnerWalletAdapter()
  ];
  return (
    <ConnectionProvider endpoint={clusterApiUrl('mainnet-beta')}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}