"use client"

import { useCallback } from "react"
import {
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"
import { useWallet } from "@solana/wallet-adapter-react"
import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js"
import {
  TransactionBuilder,
  TransactionHelper,
  TransactionWrapper,
} from "@solworks/soltoolkit-sdk"
import { DisperseSettings } from "./useSettings"
import { TokenBalance, SOL_MINT } from "./useTokens"
import { Recipient, TransactionRecord, TransactionStatus } from "@/app/components/wizard/WizardProvider"

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

interface DisperseParams {
  token: TokenBalance
  recipients: Recipient[]
  settings: DisperseSettings
  onTransactionUpdate: (id: string, updates: Partial<TransactionRecord>) => void
  onBatchStart?: (batchIndex: number, totalBatches: number) => void
}

export function useDisperse() {
  const { publicKey, signAllTransactions } = useWallet()

  const disperse = useCallback(
    async ({
      token,
      recipients,
      settings,
      onTransactionUpdate,
      onBatchStart,
    }: DisperseParams): Promise<{ success: boolean; error?: string }> => {
      if (!publicKey || !signAllTransactions) {
        return { success: false, error: "Wallet not connected" }
      }

      const validRecipients = recipients.filter((r) => r.isValid && r.amount > 0)
      if (validRecipients.length === 0) {
        return { success: false, error: "No valid recipients" }
      }

      try {
        const config = {
          commitment: settings.commitment,
          confirmTransactionInitialTimeout: settings.connectionTimeout * 1000,
        }
        const conn = new Connection(settings.rpcEndpoint, config)
        const recentBlockhash = (await conn.getLatestBlockhashAndContext("max")).value.blockhash

        const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: settings.priorityFeeRate,
        })

        const txs: Transaction[] = []
        const recipientToTxIndex: Map<string, number> = new Map()

        if (token.mint === SOL_MINT) {
          const chunks = chunkArray(validRecipients, 20)
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const ixs = chunk.map((recipient) => {
              recipientToTxIndex.set(recipient.id, i)
              const amount = settings.useRawInput
                ? recipient.amount
                : recipient.amount * LAMPORTS_PER_SOL

              return SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(recipient.address),
                lamports: Math.floor(amount),
              })
            })

            const tx = TransactionBuilder.create()
              .addIx(ixs)
              .addIx(priorityFeeIx)
              .build()
            tx.recentBlockhash = recentBlockhash
            tx.feePayer = publicKey
            txs.push(tx)
          }
        } else {
          const chunks = chunkArray(validRecipients, 10)

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const ixs: any[] = []

            for (const recipient of chunk) {
              recipientToTxIndex.set(recipient.id, i)

              try {
                const recipientPubkey = new PublicKey(recipient.address)
                const mintPubkey = new PublicKey(token.mint)

                const createTokenAccountIx = await TransactionHelper.createTokenAccountIx({
                  connectionOrConnectionManager: conn,
                  mint: mintPubkey,
                  owner: recipientPubkey,
                  payer: publicKey,
                })

                const amount = settings.useRawInput
                  ? recipient.amount
                  : recipient.amount * Math.pow(10, token.decimals)

                const transferIx = TransactionHelper.createSplTransferIx({
                  fromTokenAccount: getAssociatedTokenAddressSync(mintPubkey, publicKey),
                  toTokenAccount: getAssociatedTokenAddressSync(mintPubkey, recipientPubkey),
                  rawAmount: Math.floor(amount),
                  owner: publicKey,
                })

                if (createTokenAccountIx !== null) {
                  ixs.push(createTokenAccountIx)
                }
                ixs.push(transferIx)
              } catch (err) {
                console.error(`Error preparing tx for ${recipient.address}:`, err)
                onTransactionUpdate(recipient.id, {
                  status: "error",
                  error: "Failed to prepare transaction",
                })
              }
            }

            if (ixs.length > 0) {
              const tx = TransactionBuilder.create()
                .addIx(ixs)
                .addIx(priorityFeeIx)
                .build()
              tx.recentBlockhash = recentBlockhash
              tx.feePayer = publicKey
              txs.push(tx)
            }

            if (settings.delayBetweenBatches > 0 && i < chunks.length - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, settings.delayBetweenBatches * 1000)
              )
            }
          }
        }

        validRecipients.forEach((r) => {
          onTransactionUpdate(r.id, { status: "signing" })
        })

        const signedTxs = await signAllTransactions(txs)

        const txIdToRecipients: Map<string, string[]> = new Map()

        for (let i = 0; i < signedTxs.length; i++) {
          const tx = signedTxs[i]
          const recipientIds = validRecipients
            .filter((r) => recipientToTxIndex.get(r.id) === i)
            .map((r) => r.id)

          recipientIds.forEach((id) => {
            onTransactionUpdate(id, { status: "sending" })
          })

          try {
            onBatchStart?.(i + 1, signedTxs.length)
            const txid = await conn.sendRawTransaction(tx.serialize())

            txIdToRecipients.set(txid, recipientIds)

            recipientIds.forEach((id) => {
              onTransactionUpdate(id, {
                status: "confirming",
                txId: txid,
              })
            })
          } catch (err: any) {
            console.error(`Error sending batch ${i}:`, err)
            recipientIds.forEach((id) => {
              onTransactionUpdate(id, {
                status: "error",
                error: err.message || "Transaction failed",
              })
            })
          }
        }

        const confirmPromises = Array.from(txIdToRecipients.entries()).map(
          async ([txid, recipientIds]) => {
            try {
              await TransactionWrapper.confirmTx({
                connection: conn,
                signature: txid,
                commitment: settings.commitment,
              })

              recipientIds.forEach((id) => {
                onTransactionUpdate(id, { status: "confirmed" })
              })
            } catch (err: any) {
              console.error(`Error confirming ${txid}:`, err)
              recipientIds.forEach((id) => {
                onTransactionUpdate(id, {
                  status: "error",
                  error: err.message || "Confirmation failed",
                })
              })
            }
          }
        )

        await Promise.all(confirmPromises)

        return { success: true }
      } catch (err: any) {
        console.error("Disperse error:", err)
        return { success: false, error: err.message || "Unknown error" }
      }
    },
    [publicKey, signAllTransactions]
  )

  return { disperse }
}

