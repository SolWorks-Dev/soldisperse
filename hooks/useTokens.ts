"use client"

import { useCallback, useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import {
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import {
  fetchJupiterTokenList,
  getTokenByMint,
  JupiterToken,
} from "@/lib/jupiter"

export const SOL_MINT = "11111111111111111111111111111111"

export interface TokenBalance {
  mint: string
  symbol: string
  name: string
  decimals: number
  balance: number
  uiBalance: number
  logoURI?: string
  tokenAccount?: string
}

export function useTokens(rpcEndpoint: string) {
  const { publicKey, connected } = useWallet()
  const [tokens, setTokens] = useState<TokenBalance[]>([])
  const [jupiterTokens, setJupiterTokens] = useState<JupiterToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadJupiterTokens() {
      const tokens = await fetchJupiterTokenList()
      setJupiterTokens(tokens)
    }
    loadJupiterTokens()
  }, [])

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !rpcEndpoint) {
      setTokens([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const connection = new Connection(rpcEndpoint, "confirmed")

      const solBalance = await connection.getBalance(publicKey)

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      )

      const solToken: TokenBalance = {
        mint: SOL_MINT,
        symbol: "SOL",
        name: "Solana",
        decimals: 9,
        balance: solBalance,
        uiBalance: solBalance / LAMPORTS_PER_SOL,
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      }

      const tokenBalances: TokenBalance[] = []

      for (const account of tokenAccounts.value) {
        const parsedData = account.account.data as { parsed?: { info?: { mint?: string; tokenAmount?: { amount?: string; decimals?: number; uiAmount?: number | null } } } }
        
        if (!parsedData.parsed?.info) continue

        const info = parsedData.parsed.info
        const mintAddress = info.mint
        const tokenAmount = info.tokenAmount

        if (!mintAddress || !tokenAmount) continue
        if (tokenAmount.uiAmount === 0 || tokenAmount.uiAmount === null) continue

        const jupiterToken = getTokenByMint(jupiterTokens, mintAddress)

        tokenBalances.push({
          mint: mintAddress,
          symbol: jupiterToken?.symbol || mintAddress.slice(0, 4) + "...",
          name: jupiterToken?.name || "Unknown Token",
          decimals: tokenAmount.decimals ?? 0,
          balance: parseInt(tokenAmount.amount || "0"),
          uiBalance: tokenAmount.uiAmount ?? 0,
          logoURI: jupiterToken?.logoURI,
          tokenAccount: account.pubkey.toBase58(),
        })
      }

      const sortedTokens = tokenBalances.sort((a, b) => {
        if (a.name === "Unknown Token") return 1
        if (b.name === "Unknown Token") return -1
        return b.uiBalance - a.uiBalance
      })

      setTokens([solToken, ...sortedTokens])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch balances"
      setError(message)
      console.error("Error fetching token balances:", err)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, rpcEndpoint, jupiterTokens])

  useEffect(() => {
    if (connected && publicKey && rpcEndpoint && jupiterTokens.length > 0) {
      fetchBalances()
    } else if (!connected) {
      setTokens([])
    }
  }, [connected, publicKey, rpcEndpoint, jupiterTokens.length, fetchBalances])

  const getToken = useCallback(
    (mint: string): TokenBalance | undefined => {
      return tokens.find((t) => t.mint === mint)
    },
    [tokens]
  )

  return {
    tokens,
    isLoading,
    error,
    refetch: fetchBalances,
    getToken,
    jupiterTokens,
  }
}
