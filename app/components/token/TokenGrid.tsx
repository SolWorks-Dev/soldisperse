"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, RefreshCw, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TokenBalance } from "@/hooks/useTokens"
import { TokenCard } from "./TokenCard"

interface TokenGridProps {
  tokens: TokenBalance[]
  selectedToken: TokenBalance | null
  onSelect: (token: TokenBalance) => void
  isLoading?: boolean
  onRefresh?: () => void
  columns?: 1 | 2 | 3
}

export function TokenGrid({
  tokens,
  selectedToken,
  onSelect,
  isLoading = false,
  onRefresh,
  columns = 1,
}: TokenGridProps) {
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

  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading tokens...</p>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Coins className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No Tokens Found</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          This wallet doesn&apos;t have any tokens
        </p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        )}
      </div>

      <div className={cn("grid gap-3", gridClasses[columns])}>
        {filteredTokens.map((token, index) => (
          <motion.div
            key={token.mint}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            <TokenCard
              token={token}
              isSelected={selectedToken?.mint === token.mint}
              onClick={() => onSelect(token)}
            />
          </motion.div>
        ))}
      </div>

      {filteredTokens.length === 0 && searchQuery && (
        <div className="py-8 text-center text-muted-foreground">
          No tokens match &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  )
}

