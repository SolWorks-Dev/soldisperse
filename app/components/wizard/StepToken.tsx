"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, RefreshCw, Wallet, Coins } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { TokenBalance } from "@/hooks/useTokens"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWizard } from "./WizardProvider"

interface StepTokenProps {
  tokens: TokenBalance[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

export function StepToken({
  tokens,
  isLoading,
  error,
  onRefresh,
}: StepTokenProps) {
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { selectedToken, setSelectedToken, nextStep } = useWizard()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens
    const query = searchQuery.toLowerCase()
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.mint.toLowerCase().includes(query)
    )
  }, [tokens, searchQuery])

  const handleTokenSelect = (token: TokenBalance) => {
    setSelectedToken(token)
  }

  if (!connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Connect your Solana wallet to view your tokens and start dispersing
        </p>
        <Button onClick={() => setVisible(true)} className="mt-6">
          Connect Wallet
        </Button>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading your tokens...</p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <Coins className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Failed to Load Tokens</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">{error}</p>
        <Button onClick={onRefresh} variant="outline" className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </motion.div>
    )
  }

  if (tokens.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Coins className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No Tokens Found</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          This wallet doesn&apos;t have any tokens yet
        </p>
        <Button onClick={onRefresh} variant="outline" className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Select a Token</h2>
        <p className="mt-2 text-muted-foreground">
          Choose the token you want to disperse
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="grid gap-3">
        {filteredTokens.map((token, index) => (
          <motion.button
            key={token.mint}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => handleTokenSelect(token)}
            className={cn(
              "token-card flex items-center gap-4 text-left",
              selectedToken?.mint === token.mint && "border-accent bg-accent/10"
            )}
            data-selected={selectedToken?.mint === token.mint}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {token.logoURI ? (
                <img
                  src={token.logoURI}
                  alt={token.symbol}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              ) : (
                <Coins className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{token.symbol}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {token.name}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Balance: {token.uiBalance.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
              </div>
            </div>
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                selectedToken?.mint === token.mint
                  ? "border-accent bg-accent"
                  : "border-muted-foreground/30"
              )}
            >
              {selectedToken?.mint === token.mint && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="h-2 w-2 rounded-full bg-accent-foreground"
                />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {filteredTokens.length === 0 && searchQuery && (
        <div className="py-8 text-center text-muted-foreground">
          No tokens match &quot;{searchQuery}&quot;
        </div>
      )}
    </motion.div>
  )
}

