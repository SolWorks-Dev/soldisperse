"use client"

import { useState } from "react"
import { Settings, Server, Clock, Zap, Layers, Code, RotateCcw } from "lucide-react"
import { Commitment } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { DisperseSettings } from "@/hooks/useSettings"

interface SettingsSheetProps {
  settings: DisperseSettings
  onUpdate: (updates: Partial<DisperseSettings>) => void
  onReset: () => void
  trigger?: React.ReactNode
}

const COMMITMENT_OPTIONS: { value: Commitment; label: string; description: string }[] = [
  { value: "processed", label: "Processed", description: "Fastest, but may be rolled back" },
  { value: "confirmed", label: "Confirmed", description: "Balanced speed and reliability" },
  { value: "finalized", label: "Finalized", description: "Slowest, but guaranteed" },
]

export function SettingsSheet({
  settings,
  onUpdate,
  onReset,
  trigger,
}: SettingsSheetProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const handleUpdate = <K extends keyof DisperseSettings>(
    key: K,
    value: DisperseSettings[K]
  ) => {
    onUpdate({ [key]: value })
    toast({
      title: "Settings updated",
      description: `${key} has been updated`,
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your disperse preferences
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">RPC Endpoint</h3>
            </div>
            <Input
              value={settings.rpcEndpoint}
              onChange={(e) => handleUpdate("rpcEndpoint", e.target.value)}
              placeholder="https://api.mainnet-beta.solana.com"
            />
            <p className="text-xs text-muted-foreground">
              Your Solana RPC endpoint for transactions
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Commitment Level</h3>
            </div>
            <div className="grid gap-2">
              {COMMITMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleUpdate("commitment", option.value)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border border-border p-3 text-left transition-colors",
                    settings.commitment === option.value
                      ? "border-accent bg-accent/10"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Priority Fee</h3>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.priorityFeeRate}
                onChange={(e) =>
                  handleUpdate("priorityFeeRate", parseFloat(e.target.value) || 0)
                }
                className="w-full"
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                microLamports
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher fees = faster transactions during congestion
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Connection Timeout</h3>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.connectionTimeout}
                onChange={(e) =>
                  handleUpdate("connectionTimeout", parseInt(e.target.value) || 120)
                }
                className="w-full"
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                seconds
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Batch Delay</h3>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.delayBetweenBatches}
                onChange={(e) =>
                  handleUpdate("delayBetweenBatches", parseFloat(e.target.value) || 0)
                }
                className="w-full"
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                seconds
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Delay between transaction batches
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Advanced Options</h3>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted">
              <div>
                <span className="font-medium">Use Raw Input</span>
                <p className="text-xs text-muted-foreground">
                  Enter amounts as raw token units
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.useRawInput}
                onChange={(e) => handleUpdate("useRawInput", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
            </label>
          </div>

          <Separator />

          <Button
            variant="outline"
            onClick={() => {
              onReset()
              toast({
                title: "Settings reset",
                description: "All settings have been reset to defaults",
              })
            }}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
