"use client"

import { useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Home,
  Copy,
  Clock,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useWizard, TransactionStatus } from "./WizardProvider"

const STATUS_CONFIG: Record<
  TransactionStatus,
  { icon: React.ElementType; label: string; color: string }
> = {
  pending: { icon: Clock, label: "Pending", color: "text-muted-foreground" },
  signing: { icon: Loader2, label: "Signing", color: "text-accent" },
  sending: { icon: Send, label: "Sending", color: "text-accent" },
  confirming: { icon: Loader2, label: "Confirming", color: "text-accent" },
  confirmed: { icon: CheckCircle2, label: "Confirmed", color: "text-success" },
  error: { icon: XCircle, label: "Failed", color: "text-destructive" },
}

export function StepProgress() {
  const { toast } = useToast()
  const {
    transactions,
    selectedToken,
    reset,
    isProcessing,
    getTotalAmount,
  } = useWizard()

  const stats = useMemo(() => {
    const confirmed = transactions.filter((t) => t.status === "confirmed").length
    const failed = transactions.filter((t) => t.status === "error").length
    const pending = transactions.filter(
      (t) => !["confirmed", "error"].includes(t.status)
    ).length
    const total = transactions.length

    return { confirmed, failed, pending, total }
  }, [transactions])

  const progress = stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0
  const isComplete = stats.pending === 0 && stats.total > 0
  const hasErrors = stats.failed > 0
  const allSuccess = isComplete && !hasErrors

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  const formatAddress = (address: string): string => {
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"
            >
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </motion.div>
          ) : allSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
              >
                <CheckCircle2 className="h-8 w-8 text-success" />
              </motion.div>
            </motion.div>
          ) : hasErrors && isComplete ? (
            <motion.div
              key="partial"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10"
            >
              <XCircle className="h-8 w-8 text-destructive" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <h2 className="text-2xl font-bold tracking-tight">
          {isProcessing
            ? "Dispersing Tokens..."
            : allSuccess
            ? "Disperse Complete!"
            : hasErrors && isComplete
            ? "Disperse Completed with Errors"
            : "Processing..."}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {isProcessing
            ? `Sending ${selectedToken?.symbol} to ${stats.total} recipients`
            : allSuccess
            ? `Successfully sent ${getTotalAmount().toLocaleString()} ${selectedToken?.symbol}`
            : hasErrors && isComplete
            ? `${stats.confirmed} succeeded, ${stats.failed} failed`
            : "Please wait..."}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {stats.confirmed} / {stats.total} confirmed
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={cn(
              "h-full rounded-full",
              hasErrors ? "bg-destructive" : "bg-success"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
          />
        </div>
      </div>

      <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-4">
        {transactions.map((tx, index) => {
          const config = STATUS_CONFIG[tx.status]
          const Icon = config.icon
          const isAnimating = ["signing", "sending", "confirming"].includes(tx.status)

          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    config.color,
                    isAnimating && "animate-spin"
                  )}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm">
                      {formatAddress(tx.address)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(tx.address, "Address")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.amount.toLocaleString()} {selectedToken?.symbol}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "text-xs font-medium",
                    config.color
                  )}
                >
                  {config.label}
                </span>
                {tx.txId && (
                  <a
                    href={`https://solscan.io/tx/${tx.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          )
        })}

        {transactions.length === 0 && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing transactions...
          </div>
        )}
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex gap-3"
        >
          {hasErrors && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // TODO: Implement retry failed
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry Failed
            </Button>
          )}
          <Button className="flex-1" onClick={reset}>
            <Home className="mr-2 h-4 w-4" />
            New Disperse
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

