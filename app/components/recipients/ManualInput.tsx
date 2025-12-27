"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Recipient } from "../wizard/WizardProvider"
import { RecipientRow } from "./RecipientRow"

interface ManualInputProps {
  recipients: Recipient[]
  onAdd: () => void
  onUpdate: (id: string, updates: Partial<Recipient>) => void
  onRemove: (id: string) => void
  enableVariableAmounts: boolean
  tokenSymbol?: string
}

export function ManualInput({
  recipients,
  onAdd,
  onUpdate,
  onRemove,
  enableVariableAmounts,
  tokenSymbol = "tokens",
}: ManualInputProps) {
  return (
    <div className="space-y-3">
      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {recipients.map((recipient, index) => (
            <RecipientRow
              key={recipient.id}
              recipient={recipient}
              index={index}
              onUpdate={(updates) => onUpdate(recipient.id, updates)}
              onRemove={() => onRemove(recipient.id)}
              showAmount={enableVariableAmounts}
              tokenSymbol={tokenSymbol}
            />
          ))}
        </AnimatePresence>

        {recipients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center"
          >
            <p className="text-muted-foreground">No recipients added yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="mt-3"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Recipient
            </Button>
          </motion.div>
        )}
      </div>

      {recipients.length > 0 && (
        <Button variant="outline" onClick={onAdd} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Recipient
        </Button>
      )}
    </div>
  )
}

