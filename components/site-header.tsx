"use client"

import { useMemo } from "react"
import Link from "next/link"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react"
import {
  WalletDisconnectButton,
  WalletModalProvider,
  WalletMultiButton,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui"
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"
import { Mail } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"

require("@solana/wallet-adapter-react-ui/styles.css")

export const Wallet = ({ children }: { children: any }) => {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [new UnsafeBurnerWalletAdapter()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function SiteHeader() {
  const { setVisible } = useWalletModal()
  const { publicKey, connected, disconnect } = useWallet()
  return (
    <Wallet>
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-20 items-center space-x-4 sm:justify-between sm:space-x-0">
          <MainNav items={siteConfig.mainNav} />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className={buttonVariants({
                    size: "sm",
                    variant: "ghost",
                  })}
                >
                  <Icons.gitHub className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </div>
              </Link>
              <Link
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className={buttonVariants({
                    size: "sm",
                    variant: "ghost",
                  })}
                >
                  <Icons.twitter className="h-5 w-5 fill-current" />
                  <span className="sr-only">Twitter</span>
                </div>
              </Link>
              <ThemeToggle />
              {!connected && (
                <Button
                  onClick={() => {
                    if (!connected) {
                      setVisible(true)
                    } else {
                      disconnect()
                    }
                  }}
                >
                  Connect Wallet
                </Button>
              )}
              {connected && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button>{`${publicKey?.toBase58().slice(0, 8)}...`}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>
                      {publicKey?.toBase58().slice(0, 16)}...
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        // add address to clipboard
                        navigator.clipboard.writeText(
                          publicKey?.toBase58() || ""
                        )
                      }}
                    >
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        disconnect()
                      }}
                    >
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>
        </div>
      </header>
    </Wallet>
  )
}
