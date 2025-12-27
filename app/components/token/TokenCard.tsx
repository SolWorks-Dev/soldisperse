"use client"

import { motion } from "framer-motion"
import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { TokenBalance } from "@/hooks/useTokens"

interface TokenCardProps {
  token: TokenBalance
  isSelected?: boolean
  onClick?: () => void
  showBalance?: boolean
  size?: "sm" | "md" | "lg"
}

export function TokenCard({
  token,
  isSelected = false,
  onClick,
  showBalance = true,
  size = "md",
}: TokenCardProps) {
  const sizeClasses = {
    sm: {
      container: "p-2 gap-2",
      icon: "h-8 w-8",
      iconInner: "h-4 w-4",
      text: "text-sm",
      balance: "text-xs",
    },
    md: {
      container: "p-4 gap-4",
      icon: "h-10 w-10",
      iconInner: "h-5 w-5",
      text: "text-base",
      balance: "text-sm",
    },
    lg: {
      container: "p-5 gap-5",
      icon: "h-12 w-12",
      iconInner: "h-6 w-6",
      text: "text-lg",
      balance: "text-base",
    },
  }

  const sizes = sizeClasses[size]

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "token-card flex w-full items-center text-left",
        sizes.container,
        isSelected && "border-accent bg-accent/10"
      )}
      data-selected={isSelected}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
          sizes.icon
        )}
      >
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
          <Coins className={cn("text-muted-foreground", sizes.iconInner)} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium", sizes.text)}>{token.symbol}</span>
          <span
            className={cn(
              "truncate text-muted-foreground",
              sizes.balance
            )}
          >
            {token.name}
          </span>
        </div>
        {showBalance && (
          <div className={cn("text-muted-foreground", sizes.balance)}>
            Balance:{" "}
            {token.uiBalance.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
          </div>
        )}
      </div>

      {onClick && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            size === "sm" ? "h-4 w-4" : "h-5 w-5",
            isSelected
              ? "border-accent bg-accent"
              : "border-muted-foreground/30"
          )}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "rounded-full bg-accent-foreground",
                size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
              )}
            />
          )}
        </div>
      )}
    </motion.button>
  )
}

