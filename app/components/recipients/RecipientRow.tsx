"use client"

import { motion } from "framer-motion"
import { Trash2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Recipient } from "../wizard/WizardProvider"

interface RecipientRowProps {
  recipient: Recipient
  index: number
  onUpdate: (updates: Partial<Recipient>) => void
  onRemove: () => void
  showAmount?: boolean
  tokenSymbol?: string
}

export function RecipientRow({
  recipient,
  index,
  onUpdate,
  onRemove,
  showAmount = false,
  tokenSymbol = "tokens",
}: RecipientRowProps) {
  const hasError = recipient.address.trim() && !recipient.isValid

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-1"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {index + 1}
        </span>

        <div className="relative flex-1">
          <Input
            placeholder="Solana address"
            value={recipient.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            className={cn(
              "font-mono text-sm pr-8",
              hasError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {recipient.address.trim() && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {recipient.isValid ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>

        {showAmount && (
          <Input
            type="number"
            placeholder="Amount"
            value={recipient.amount || ""}
            onChange={(e) =>
              onUpdate({ amount: parseFloat(e.target.value) || 0 })
            }
            className="w-28"
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {hasError && recipient.error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="ml-8 text-xs text-destructive"
        >
          {recipient.error}
        </motion.p>
      )}
    </motion.div>
  )
}

