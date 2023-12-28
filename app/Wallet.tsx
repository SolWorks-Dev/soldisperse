"use client"

import { Toaster } from "@/components/ui/toaster"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"

export const Wallet = ({ children }: { children: any }) => {
  const wallets = [new UnsafeBurnerWalletAdapter()];
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