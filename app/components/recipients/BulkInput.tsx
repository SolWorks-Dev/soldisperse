"use client"

import { useCallback } from "react"
import { PublicKey } from "@solana/web3.js"
import { AlertCircle, Check, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Recipient } from "../wizard/WizardProvider"

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

interface BulkInputProps {
  value: string
  onChange: (value: string) => void
  onParsed: (recipients: Recipient[]) => void
  defaultAmount: number
  enableVariableAmounts: boolean
  tokenSymbol?: string
}

export function BulkInput({
  value,
  onChange,
  onParsed,
  defaultAmount,
  enableVariableAmounts,
  tokenSymbol = "tokens",
}: BulkInputProps) {
  const parseInput = useCallback(
    (text: string) => {
      const lines = text.split("\n").filter((line) => line.trim())
      const parsed: Recipient[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        let address: string
        let amount: number

        if (trimmed.includes(",")) {
          const parts = trimmed.split(",")
          address = parts[0].trim()
          amount = parseFloat(parts[1]?.trim() || "0") || defaultAmount
        } else {
          address = trimmed
          amount = defaultAmount
        }

        const isValid = validateAddress(address)

        parsed.push({
          id: generateId(),
          address,
          amount,
          isValid,
          error: isValid ? undefined : "Invalid address",
        })
      }

      onParsed(parsed)
    },
    [defaultAmount, onParsed]
  )

  const handleChange = (text: string) => {
    onChange(text)
    parseInput(text)
  }

  const lineCount = value.split("\n").filter((l) => l.trim()).length
  const validCount = value
    .split("\n")
    .filter((l) => l.trim())
    .filter((l) => {
      const address = l.includes(",") ? l.split(",")[0].trim() : l.trim()
      return validateAddress(address)
    }).length
  const invalidCount = lineCount - validCount

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Paste addresses below</span>
        </div>
        {lineCount > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-success">
              <Check className="h-3.5 w-3.5" />
              {validCount} valid
            </span>
            {invalidCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {invalidCount} invalid
              </span>
            )}
          </div>
        )}
      </div>

      <Textarea
        placeholder={
          enableVariableAmounts
            ? `Paste addresses with amounts (one per line)\n\naddress1,100\naddress2,250\naddress3,50`
            : `Paste addresses (one per line)\n\naddress1\naddress2\naddress3`
        }
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="min-h-[200px] font-mono text-sm"
      />

      <p className="text-xs text-muted-foreground">
        {enableVariableAmounts ? (
          <>
            Format: <code className="rounded bg-muted px-1.5 py-0.5">address,amount</code> per line
          </>
        ) : (
          <>
            Each {defaultAmount.toLocaleString()} {tokenSymbol} will be sent to each address
          </>
        )}
      </p>
    </div>
  )
}

