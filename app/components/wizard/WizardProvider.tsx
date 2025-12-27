"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react"
import { PublicKey } from "@solana/web3.js"
import { TokenBalance } from "@/hooks/useTokens"

export type WizardStep = "setup" | "token" | "recipients" | "review" | "progress"

export interface Recipient {
  id: string
  address: string
  amount: number
  isValid: boolean
  error?: string
}

export type TransactionStatus =
  | "pending"
  | "signing"
  | "sending"
  | "confirming"
  | "confirmed"
  | "error"

export interface TransactionRecord {
  id: string
  address: string
  amount: number
  status: TransactionStatus
  txId?: string
  error?: string
}

interface WizardState {
  currentStep: WizardStep
  selectedToken: TokenBalance | null
  amount: number
  recipients: Recipient[]
  transactions: TransactionRecord[]
  inputMode: "bulk" | "manual"
  isProcessing: boolean
}

interface WizardContextValue extends WizardState {
  setStep: (step: WizardStep) => void
  nextStep: () => void
  prevStep: () => void
  canGoNext: () => boolean
  canGoPrev: () => boolean
  setSelectedToken: (token: TokenBalance | null) => void
  setAmount: (amount: number) => void
  setRecipients: (recipients: Recipient[]) => void
  addRecipient: () => void
  updateRecipient: (id: string, updates: Partial<Recipient>) => void
  removeRecipient: (id: string) => void
  setInputMode: (mode: "bulk" | "manual") => void
  setTransactions: (transactions: TransactionRecord[]) => void
  updateTransaction: (id: string, updates: Partial<TransactionRecord>) => void
  setIsProcessing: (processing: boolean) => void
  reset: () => void
  getTotalAmount: () => number
  getValidRecipients: () => Recipient[]
}

const STEP_ORDER: WizardStep[] = ["setup", "token", "recipients", "review", "progress"]

const initialState: WizardState = {
  currentStep: "setup",
  selectedToken: null,
  amount: 0,
  recipients: [],
  transactions: [],
  inputMode: "bulk",
  isProcessing: false,
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined)

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function validateAddress(address: string): { isValid: boolean; error?: string } {
  if (!address.trim()) {
    return { isValid: false, error: "Address is required" }
  }

  try {
    new PublicKey(address.trim())
    return { isValid: true }
  } catch {
    return { isValid: false, error: "Invalid Solana address" }
  }
}

export function WizardProvider({ 
  children,
  skipSetup = false,
}: { 
  children: ReactNode
  skipSetup?: boolean
}) {
  const [state, setState] = useState<WizardState>(() => ({
    ...initialState,
    currentStep: skipSetup ? "token" : "setup",
  }))

  const setStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }, [])

  const nextStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep)
      if (currentIndex < STEP_ORDER.length - 1) {
        return { ...prev, currentStep: STEP_ORDER[currentIndex + 1] }
      }
      return prev
    })
  }, [])

  const prevStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep)
      const minIndex = skipSetup ? 1 : 0
      if (currentIndex > minIndex) {
        return { ...prev, currentStep: STEP_ORDER[currentIndex - 1] }
      }
      return prev
    })
  }, [skipSetup])

  const canGoNext = useCallback((): boolean => {
    const { currentStep, selectedToken, recipients, amount } = state
    
    switch (currentStep) {
      case "setup":
        return true
      case "token":
        return selectedToken !== null
      case "recipients":
        const validRecipients = recipients.filter((r) => r.isValid && r.amount > 0)
        return validRecipients.length > 0
      case "review":
        return true
      case "progress":
        return false
      default:
        return false
    }
  }, [state])

  const canGoPrev = useCallback((): boolean => {
    const minStep = skipSetup ? "token" : "setup"
    return state.currentStep !== minStep && state.currentStep !== "progress"
  }, [state.currentStep, skipSetup])

  const setSelectedToken = useCallback((token: TokenBalance | null) => {
    setState((prev) => ({ ...prev, selectedToken: token }))
  }, [])

  const setAmount = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, amount }))
  }, [])

  const setRecipients = useCallback((recipients: Recipient[]) => {
    setState((prev) => ({ ...prev, recipients }))
  }, [])

  const addRecipient = useCallback(() => {
    setState((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        { id: generateId(), address: "", amount: prev.amount || 0, isValid: false },
      ],
    }))
  }, [])

  const updateRecipient = useCallback((id: string, updates: Partial<Recipient>) => {
    setState((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) => {
        if (r.id !== id) return r
        
        const updated = { ...r, ...updates }
        
        if (updates.address !== undefined) {
          const validation = validateAddress(updates.address)
          updated.isValid = validation.isValid
          updated.error = validation.error
        }
        
        return updated
      }),
    }))
  }, [])

  const removeRecipient = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r.id !== id),
    }))
  }, [])

  const setInputMode = useCallback((mode: "bulk" | "manual") => {
    setState((prev) => ({ ...prev, inputMode: mode }))
  }, [])

  const setTransactions = useCallback((transactions: TransactionRecord[]) => {
    setState((prev) => ({ ...prev, transactions }))
  }, [])

  const updateTransaction = useCallback((id: string, updates: Partial<TransactionRecord>) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }))
  }, [])

  const setIsProcessing = useCallback((isProcessing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing }))
  }, [])

  const reset = useCallback(() => {
    setState({
      ...initialState,
      currentStep: skipSetup ? "token" : "setup",
    })
  }, [skipSetup])

  const getTotalAmount = useCallback((): number => {
    return state.recipients
      .filter((r) => r.isValid)
      .reduce((sum, r) => sum + r.amount, 0)
  }, [state.recipients])

  const getValidRecipients = useCallback((): Recipient[] => {
    return state.recipients.filter((r) => r.isValid && r.amount > 0)
  }, [state.recipients])

  const value = useMemo<WizardContextValue>(
    () => ({
      ...state,
      setStep,
      nextStep,
      prevStep,
      canGoNext,
      canGoPrev,
      setSelectedToken,
      setAmount,
      setRecipients,
      addRecipient,
      updateRecipient,
      removeRecipient,
      setInputMode,
      setTransactions,
      updateTransaction,
      setIsProcessing,
      reset,
      getTotalAmount,
      getValidRecipients,
    }),
    [
      state,
      setStep,
      nextStep,
      prevStep,
      canGoNext,
      canGoPrev,
      setSelectedToken,
      setAmount,
      setRecipients,
      addRecipient,
      updateRecipient,
      removeRecipient,
      setInputMode,
      setTransactions,
      updateTransaction,
      setIsProcessing,
      reset,
      getTotalAmount,
      getValidRecipients,
    ]
  )

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext)
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider")
  }
  return context
}

