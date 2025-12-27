"use client"

import { motion } from "framer-motion"
import { Coins, Users, Edit2, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWizard } from "./WizardProvider"

export function StepReview() {
  const {
    selectedToken,
    recipients,
    setStep,
    getValidRecipients,
    getTotalAmount,
  } = useWizard()

  const validRecipients = getValidRecipients()
  const totalAmount = getTotalAmount()
  const hasInsufficientBalance =
    selectedToken && totalAmount > selectedToken.uiBalance

  const formatAddress = (address: string): string => {
    if (address.length <= 16) return address
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Review & Confirm</h2>
        <p className="mt-2 text-muted-foreground">
          Please review your disperse details before sending
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
              {selectedToken?.logoURI ? (
                <img
                  src={selectedToken.logoURI}
                  alt={selectedToken.symbol}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Coins className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-semibold">{selectedToken?.symbol}</div>
              <div className="text-sm text-muted-foreground">
                {selectedToken?.name}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("token")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <div className="text-sm text-muted-foreground">Your Balance</div>
            <div className="font-medium">
              {selectedToken?.uiBalance.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              {selectedToken?.symbol}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">After Disperse</div>
            <div
              className={cn(
                "font-medium",
                hasInsufficientBalance && "text-destructive"
              )}
            >
              {selectedToken
                ? (selectedToken.uiBalance - totalAmount).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 4 }
                  )
                : 0}{" "}
              {selectedToken?.symbol}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {validRecipients.length} Recipients
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("recipients")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>

        <div className="mt-4 max-h-[200px] space-y-2 overflow-y-auto">
          {validRecipients.map((recipient, index) => (
            <motion.div
              key={recipient.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.02, duration: 0.2 }}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
            >
              <span className="font-mono text-sm">
                {formatAddress(recipient.address)}
              </span>
              <span className="text-sm font-medium">
                {recipient.amount.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{" "}
                {selectedToken?.symbol}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-muted-foreground">Total Amount</span>
          <span className="text-lg font-bold">
            {totalAmount.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}{" "}
            {selectedToken?.symbol}
          </span>
        </div>
      </motion.div>

      {hasInsufficientBalance && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <div className="font-medium text-destructive">
              Insufficient Balance
            </div>
            <div className="text-sm text-destructive/80">
              You need{" "}
              {(totalAmount - (selectedToken?.uiBalance || 0)).toLocaleString(
                undefined,
                { maximumFractionDigits: 4 }
              )}{" "}
              more {selectedToken?.symbol} to complete this disperse
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <p>
            Transactions will be batched for efficiency. You will be prompted to
            sign all transactions at once.
          </p>
          <p className="mt-2">
            Network fees will apply. Make sure you have enough SOL for
            transaction fees.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

