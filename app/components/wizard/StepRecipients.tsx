"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Users, FileText, List, AlertCircle, Check } from "lucide-react"
import { PublicKey } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useWizard, Recipient } from "./WizardProvider"

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function validateAddress(address: string): boolean {
  if (!address.trim()) return false
  try {
    new PublicKey(address.trim())
    return true
  } catch {
    return false
  }
}

export function StepRecipients() {
  const {
    selectedToken,
    recipients,
    setRecipients,
    addRecipient,
    updateRecipient,
    removeRecipient,
    inputMode,
    setInputMode,
    amount,
    setAmount,
  } = useWizard()

  const [bulkInput, setBulkInput] = useState("")
  const [enableVariableAmounts, setEnableVariableAmounts] = useState(false)

  const parseBulkInput = useCallback(
    (text: string) => {
      const lines = text.split("\n").filter((line) => line.trim())
      const parsed: Recipient[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        let address: string
        let recipientAmount: number

        if (trimmed.includes(",")) {
          const parts = trimmed.split(",")
          address = parts[0].trim()
          recipientAmount = parseFloat(parts[1]?.trim() || "0") || amount
        } else {
          address = trimmed
          recipientAmount = amount
        }

        const isValid = validateAddress(address)

        parsed.push({
          id: generateId(),
          address,
          amount: recipientAmount,
          isValid,
          error: isValid ? undefined : "Invalid address",
        })
      }

      setRecipients(parsed)
    },
    [amount, setRecipients]
  )

  const handleBulkInputChange = (value: string) => {
    setBulkInput(value)
    parseBulkInput(value)
  }

  const validCount = recipients.filter((r) => r.isValid && r.amount > 0).length
  const invalidCount = recipients.filter((r) => !r.isValid && r.address.trim()).length
  const totalAmount = recipients
    .filter((r) => r.isValid)
    .reduce((sum, r) => sum + r.amount, 0)

  const hasInsufficientBalance =
    selectedToken && totalAmount > selectedToken.uiBalance

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Add Recipients</h2>
        <p className="mt-2 text-muted-foreground">
          Enter the addresses you want to send{" "}
          <span className="font-medium text-foreground">
            {selectedToken?.symbol}
          </span>{" "}
          to
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setInputMode("bulk")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            inputMode === "bulk"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Bulk Paste
        </button>
        <button
          onClick={() => setInputMode("manual")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            inputMode === "manual"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="h-4 w-4" />
          Manual Entry
        </button>
      </div>

      {!enableVariableAmounts && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount per recipient</label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount || ""}
            onChange={(e) => {
              const newAmount = parseFloat(e.target.value) || 0
              setAmount(newAmount)
              if (inputMode === "bulk") {
                setRecipients(
                  recipients.map((r) => ({ ...r, amount: newAmount }))
                )
              }
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEnableVariableAmounts(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Use variable amounts per address →
            </button>
          </div>
        </div>
      )}

      {enableVariableAmounts && (
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Variable amounts enabled
            </span>
            <button
              onClick={() => setEnableVariableAmounts(false)}
              className="text-xs text-accent hover:underline"
            >
              Use fixed amount
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Format: <code className="rounded bg-muted px-1">address,amount</code> per line
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {inputMode === "bulk" ? (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <Textarea
              placeholder={
                enableVariableAmounts
                  ? "address1,amount1\naddress2,amount2\naddress3,amount3"
                  : "Enter one address per line\n\naddress1\naddress2\naddress3"
              }
              value={bulkInput}
              onChange={(e) => handleBulkInputChange(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              <AnimatePresence initial={false}>
                {recipients.map((recipient, index) => (
                  <motion.div
                    key={recipient.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Solana address"
                          value={recipient.address}
                          onChange={(e) =>
                            updateRecipient(recipient.id, {
                              address: e.target.value,
                            })
                          }
                          className={cn(
                            "flex-1 font-mono text-sm",
                            recipient.address && !recipient.isValid && "border-destructive"
                          )}
                        />
                        {enableVariableAmounts && (
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={recipient.amount || ""}
                            onChange={(e) =>
                              updateRecipient(recipient.id, {
                                amount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-28"
                          />
                        )}
                      </div>
                      {recipient.error && recipient.address && (
                        <p className="text-xs text-destructive">
                          {recipient.error}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecipient(recipient.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Button
              variant="outline"
              onClick={addRecipient}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Recipient
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{validCount} valid recipients</span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {invalidCount} invalid
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
              {selectedToken?.symbol}
              {hasInsufficientBalance && (
                <span className="ml-2 text-destructive">(Insufficient balance)</span>
              )}
            </div>
          </div>
          {validCount > 0 && !hasInsufficientBalance && (
            <Check className="h-5 w-5 text-success" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

