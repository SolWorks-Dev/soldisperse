"use client"

import { useCallback, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useSettings } from "@/hooks/useSettings"
import { useTokens } from "@/hooks/useTokens"
import { useDisperse } from "@/hooks/useDisperse"
import { useToast } from "@/components/ui/use-toast"
import {
  WizardProvider,
  useWizard,
  TransactionRecord,
} from "./components/wizard/WizardProvider"
import { WizardLayout, StepContent } from "./components/wizard/WizardLayout"
import { StepSetup } from "./components/wizard/StepSetup"
import { StepToken } from "./components/wizard/StepToken"
import { StepRecipients } from "./components/wizard/StepRecipients"
import { StepReview } from "./components/wizard/StepReview"
import { StepProgress } from "./components/wizard/StepProgress"
import { SettingsSheet } from "./components/common/SettingsSheet"

function DisperseWizard() {
  const { toast } = useToast()
  const { connected } = useWallet()
  const {
    settings,
    isLoaded,
    needsSetup,
    updateSettings,
    resetSettings,
    completeSetup,
  } = useSettings()

  const {
    tokens,
    isLoading: isLoadingTokens,
    error: tokenError,
    refetch: refetchTokens,
  } = useTokens(settings.rpcEndpoint)

  const { disperse } = useDisperse()

  const {
    currentStep,
    selectedToken,
    recipients,
    setTransactions,
    updateTransaction,
    setIsProcessing,
    setStep,
    getValidRecipients,
    nextStep,
  } = useWizard()

  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSetupComplete = useCallback(
    (rpcEndpoint: string) => {
      completeSetup(rpcEndpoint)
      toast({
        title: "Setup complete",
        description: "Your preferences have been saved",
      })
    },
    [completeSetup, toast]
  )

  const handleSendTokens = useCallback(async () => {
    if (!selectedToken) {
      toast({
        title: "No token selected",
        description: "Please select a token to disperse",
      })
      return
    }

    const validRecipients = getValidRecipients()
    if (validRecipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one valid recipient",
      })
      return
    }

    const initialTransactions: TransactionRecord[] = validRecipients.map((r) => ({
      id: r.id,
      address: r.address,
      amount: r.amount,
      status: "pending",
    }))

    setTransactions(initialTransactions)
    setIsProcessing(true)
    nextStep()

    const result = await disperse({
      token: selectedToken,
      recipients: validRecipients,
      settings,
      onTransactionUpdate: updateTransaction,
      onBatchStart: (batch, total) => {
        toast({
          title: `Sending batch ${batch}/${total}`,
          description: "Please wait...",
        })
      },
    })

    setIsProcessing(false)

    if (result.success) {
      toast({
        title: "Disperse complete",
        description: `Successfully sent ${selectedToken.symbol} to recipients`,
      })
    } else if (result.error) {
      toast({
        title: "Disperse failed",
        description: result.error,
        variant: "destructive",
      })
    }
  }, [
    selectedToken,
    getValidRecipients,
    setTransactions,
    setIsProcessing,
    nextStep,
    disperse,
    settings,
    updateTransaction,
    toast,
  ])

  const handleNextStep = useCallback(() => {
    if (currentStep === "review") {
      handleSendTokens()
    } else {
      nextStep()
    }
  }, [currentStep, handleSendTokens, nextStep])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <WizardLayout
      hideSetup={!needsSetup}
      onOpenSettings={() => setSettingsOpen(true)}
      onNextStep={handleNextStep}
    >
      <StepContent step="setup">
        <StepSetup
          rpcEndpoint={settings.rpcEndpoint}
          onComplete={handleSetupComplete}
        />
      </StepContent>

      <StepContent step="token">
        <StepToken
          tokens={tokens}
          isLoading={isLoadingTokens}
          error={tokenError}
          onRefresh={refetchTokens}
        />
      </StepContent>

      <StepContent step="recipients">
        <StepRecipients />
      </StepContent>

      <StepContent step="review">
        <StepReview />
      </StepContent>

      <StepContent step="progress">
        <StepProgress />
      </StepContent>

      <SettingsSheet
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
        trigger={<></>}
      />
    </WizardLayout>
  )
}

export default function IndexPage() {
  const { settings, isLoaded, needsSetup } = useSettings()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <WizardProvider skipSetup={!needsSetup}>
      <DisperseWizard />
    </WizardProvider>
  )
}
