"use client"

import { useCallback, useEffect, useState } from "react"
import { Commitment } from "@solana/web3.js"

const SETTINGS_KEY = "soldisperse_settings"
const SETTINGS_VERSION = "2"

export interface DisperseSettings {
  rpcEndpoint: string
  commitment: Commitment
  priorityFeeRate: number
  connectionTimeout: number
  delayBetweenBatches: number
  useRawInput: boolean
  enableVariableAmounts: boolean
  hasCompletedSetup: boolean
}

const DEFAULT_SETTINGS: DisperseSettings = {
  rpcEndpoint: "https://api.mainnet-beta.solana.com",
  commitment: "confirmed",
  priorityFeeRate: 100,
  connectionTimeout: 120,
  delayBetweenBatches: 0,
  useRawInput: false,
  enableVariableAmounts: false,
  hasCompletedSetup: false,
}

interface StoredSettings {
  version: string
  data: DisperseSettings
}

function loadSettings(): DisperseSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed: StoredSettings = JSON.parse(stored)
      if (parsed.version === SETTINGS_VERSION) {
        return { ...DEFAULT_SETTINGS, ...parsed.data }
      }
    }
  } catch (error) {
    console.error("Error loading settings:", error)
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: DisperseSettings): void {
  if (typeof window === "undefined") return

  try {
    const toStore: StoredSettings = {
      version: SETTINGS_VERSION,
      data: settings,
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(toStore))
  } catch (error) {
    console.error("Error saving settings:", error)
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<DisperseSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loaded = loadSettings()
    setSettingsState(loaded)
    setIsLoaded(true)
  }, [])

  const updateSettings = useCallback(
    (updates: Partial<DisperseSettings>) => {
      setSettingsState((prev) => {
        const newSettings = { ...prev, ...updates }
        saveSettings(newSettings)
        return newSettings
      })
    },
    []
  )

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
  }, [])

  const completeSetup = useCallback(
    (rpcEndpoint: string) => {
      updateSettings({
        rpcEndpoint,
        hasCompletedSetup: true,
      })
    },
    [updateSettings]
  )

  const needsSetup = isLoaded && !settings.hasCompletedSetup

  return {
    settings,
    isLoaded,
    needsSetup,
    updateSettings,
    resetSettings,
    completeSetup,
  }
}
