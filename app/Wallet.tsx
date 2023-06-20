"use client"

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"

import { ToastProvider } from "@/components/ui/toast"

export const Wallet = ({ children }: { children: any }) => {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = clusterApiUrl(network)
  const wallets = [new UnsafeBurnerWalletAdapter()]

  return (
    <ToastProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ToastProvider>
  )
}
