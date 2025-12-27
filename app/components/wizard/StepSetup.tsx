"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Server, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWizard } from "./WizardProvider"

interface StepSetupProps {
  rpcEndpoint: string
  onComplete: (rpcEndpoint: string) => void
}

export function StepSetup({
  rpcEndpoint: initialRpc,
  onComplete,
}: StepSetupProps) {
  const { nextStep } = useWizard()
  const [rpcEndpoint, setRpcEndpoint] = useState(initialRpc)
  const [error, setError] = useState<string>()

  const validateAndContinue = () => {
    if (!rpcEndpoint.trim()) {
      setError("RPC endpoint is required")
      return
    }
    
    if (!rpcEndpoint.startsWith("http")) {
      setError("Invalid RPC endpoint URL")
      return
    }

    setError(undefined)
    onComplete(rpcEndpoint.trim())
    nextStep()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
      className="space-y-8"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"
        >
          <Zap className="h-8 w-8 text-accent" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to SolDisperse</h2>
        <p className="mt-2 text-muted-foreground">
          Let&apos;s set up your connection to get started
        </p>
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="rpc" className="text-sm font-medium">
              RPC Endpoint
            </label>
          </div>
          <Input
            id="rpc"
            type="url"
            placeholder="https://api.mainnet-beta.solana.com"
            value={rpcEndpoint}
            onChange={(e) => {
              setRpcEndpoint(e.target.value)
              if (error) setError(undefined)
            }}
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Your RPC endpoint for sending transactions. Get a free one at{" "}
            <a
              href="https://helius.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              Helius <ExternalLink className="h-3 w-3" />
            </a>
            {" "}or{" "}
            <a
              href="https://quicknode.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              QuickNode <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="font-medium">Why do I need this?</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• <strong>RPC Endpoint</strong> — Connects you to the Solana network</li>
          <li>• Used to fetch your token balances and send transactions</li>
          <li>• The default public RPC works but may be rate-limited</li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Button
          onClick={validateAndContinue}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  )
}
