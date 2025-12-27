"use client"

import { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Settings, Loader2 } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useWizard, WizardStep } from "./WizardProvider"
import { StepIndicator } from "./StepIndicator"

interface WizardLayoutProps {
  children: ReactNode
  onOpenSettings?: () => void
  hideSetup?: boolean
  onNextStep?: () => void
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
  }),
}

const stepTransition = {
  x: { type: "spring" as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
}

interface StepContentProps {
  step: WizardStep
  children: ReactNode
}

export function StepContent({ step, children }: StepContentProps) {
  const { currentStep } = useWizard()
  
  if (step !== currentStep) return null
  
  return <>{children}</>
}

export function WizardLayout({
  children,
  onOpenSettings,
  hideSetup = false,
  onNextStep,
}: WizardLayoutProps) {
  const { connected, publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const {
    currentStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
    isProcessing,
  } = useWizard()

  const getStepIndex = (step: WizardStep): number => {
    const steps: WizardStep[] = hideSetup
      ? ["token", "recipients", "review", "progress"]
      : ["setup", "token", "recipients", "review", "progress"]
    return steps.indexOf(step)
  }

  const getNextButtonLabel = (): string => {
    switch (currentStep) {
      case "setup":
        return "Continue"
      case "token":
        return "Continue"
      case "recipients":
        return "Review"
      case "review":
        return "Send Tokens"
      default:
        return "Continue"
    }
  }

  const showNavigation = currentStep !== "progress"

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">
              Sol<span className="text-accent">Disperse</span>
            </h1>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <StepIndicator hideSetup={hideSetup} />
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}

            {connected && publicKey ? (
              <Button
                variant="outline"
                onClick={() => disconnect()}
                className="font-mono text-sm"
              >
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </Button>
            ) : (
              <Button onClick={() => setVisible(true)}>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        <div className="container pb-3 md:hidden">
          <StepIndicator hideSetup={hideSetup} />
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8">
          <AnimatePresence mode="wait" custom={getStepIndex(currentStep)}>
            <motion.div
              key={currentStep}
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="mx-auto max-w-2xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showNavigation && (
        <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-20 items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={!canGoPrev() || isProcessing}
              className={cn(!canGoPrev() && "invisible")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={onNextStep || nextStep}
              disabled={!canGoNext() || isProcessing}
              className="min-w-[140px]"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {getNextButtonLabel()}
                  {currentStep !== "review" && (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </>
              )}
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}

