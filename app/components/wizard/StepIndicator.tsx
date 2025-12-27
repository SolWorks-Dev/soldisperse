"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { WizardStep, useWizard } from "./WizardProvider"

interface StepConfig {
  id: WizardStep
  label: string
  shortLabel: string
}

const STEPS: StepConfig[] = [
  { id: "setup", label: "Setup", shortLabel: "1" },
  { id: "token", label: "Token", shortLabel: "2" },
  { id: "recipients", label: "Recipients", shortLabel: "3" },
  { id: "review", label: "Review", shortLabel: "4" },
  { id: "progress", label: "Send", shortLabel: "5" },
]

interface StepIndicatorProps {
  hideSetup?: boolean
}

export function StepIndicator({ hideSetup = false }: StepIndicatorProps) {
  const { currentStep, setStep, selectedToken, recipients } = useWizard()

  const visibleSteps = hideSetup ? STEPS.filter((s) => s.id !== "setup") : STEPS
  const currentIndex = visibleSteps.findIndex((s) => s.id === currentStep)

  const getStepStatus = (step: StepConfig, index: number): "completed" | "current" | "upcoming" => {
    if (index < currentIndex) return "completed"
    if (index === currentIndex) return "current"
    return "upcoming"
  }

  const canNavigateToStep = (step: StepConfig, index: number): boolean => {
    if (currentStep === "progress") return false
    if (index > currentIndex) return false
    if (step.id === "setup" && hideSetup) return false
    return true
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {visibleSteps.map((step, index) => {
        const status = getStepStatus(step, index)
        const canNavigate = canNavigateToStep(step, index)
        const isLast = index === visibleSteps.length - 1

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => canNavigate && setStep(step.id)}
              disabled={!canNavigate}
              className={cn(
                "group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                status === "current" && "bg-accent text-accent-foreground",
                status === "completed" && "bg-secondary text-foreground hover:bg-secondary/80",
                status === "upcoming" && "text-muted-foreground",
                canNavigate && status !== "current" && "cursor-pointer",
                !canNavigate && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all duration-200",
                  status === "current" && "bg-accent-foreground/20",
                  status === "completed" && "bg-success text-success-foreground",
                  status === "upcoming" && "bg-muted"
                )}
              >
                {status === "completed" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </span>
              <span className="hidden whitespace-nowrap sm:inline">{step.label}</span>
            </button>

            {!isLast && (
              <div className="mx-2 hidden h-px w-8 bg-border sm:block">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: "0%" }}
                  animate={{
                    width: status === "completed" ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

