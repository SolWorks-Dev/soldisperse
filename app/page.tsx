"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"
import { TokenInfo } from "@solana/spl-token-registry"
import { useWallet } from "@solana/wallet-adapter-react"
import { Commitment, Connection, PublicKey, Transaction, ComputeBudgetProgram, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js"
import {
  Logger,
  TransactionBuilder,
  TransactionHelper,
  TransactionWrapper,
} from "@solworks/soltoolkit-sdk"
import { Copy, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { TokenSelector } from "./TokenSelector"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { PopoverTrigger } from "@radix-ui/react-popover"
import { siteConfig } from "@/config/site"

const logger = new Logger("core");
const SOL_MINT = "11111111111111111111111111111111" // this is not a real mint, just a placeholder for SOL
export interface TokenData {
  tokenAccount: string;
  mint: string;
  amount: number;
  decimals: number;
  value: string;
  label: string;
  name: string;
};
export type TransactionRecord = {
  address: PublicKey;
  amount: number;
  status: TransactionStatus;
  txId?: string;
};

export default function IndexPage() {
  const { publicKey, connected, signAllTransactions } = useWallet();
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [addresses, setAddresses] = useState<TransactionRecord[]>([]);
  const [tokenInfos, setTokenInfos] = useState<TokenInfo[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>(siteConfig.links.defaultRPC);
  const [commitment, setCommitment] = useState<Commitment>('processed');
  const [enableVariableTokenAmounts, setEnableVariableTokenAmounts] = useState<boolean>(false);
  const [delayBetweenBatches, setDelayBetweenBatches] = useState<number>(0);
  const [defaultConnectionTimeout, setDefaultConnectionTimeout] = useState<number>(120);
  const [useRawInput, setUseRawInput] = useState<boolean>(false);
  const [priorityRate, setPriorityRate] = useState<number>(100);
  const priorityFeeIx = useMemo(() => {
    return ComputeBudgetProgram.setComputeUnitPrice({microLamports: priorityRate});
  }, [priorityRate]);

  useEffect(() => {
    const loadTokenInfos = async () => {
      const response = await fetch('https://cdn.jsdelivr.net/gh/solflare-wallet/token-list@latest/solana-tokenlist.json');
      const result = await response.json();
      const tokenList = [...result.tokens as TokenInfo[], {
        "chainId": 101,
        "name": "Dean's List",
        "symbol": "DEAN",
        "address": "Ds52CDgqdWbTWsua1hgT3AuSSy4FNx2Ezge1br3jQ14a",
        "decimals": 6,
        "logoURI": "https://jvsqc5no3sgvr3ubjds3fwji52lzt7ktry55x26vxokwpn4zg3ma.arweave.net/TWUBda7cjVjugUjlstko7peZ_VOOO9vr1buVZ7eZNtg",
        "tags": [],
        "verified": true,
        "holders": null
      },
      {
        "chainId": 101,
        "name": "Founder wif out abs",
        "symbol": "FWOA",
        "address": "62U5zYJadvquCqvtqxaWfZmpLU8iT59J8z3BEfVc3Q92",
        "decimals": 6,
        "logoURI": "https://bafkreia7yu6lx35627q766bl6uc7cvahqoreitgiqj67m4ihwf6fiqop3u.ipfs.nftstorage.link",
        "tags": [],
        "verified": true,
        "holders": null
      }];
      setTokenInfos(tokenList);
    }

    const getAssetsByOwner = async () => {
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${publicKey!.toBase58()}/balances?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
      )
      const result = await response.json();
      const solBalance = result.nativeBalance;
      const accounts = result.tokens.filter((x: any) => x.amount > 0);
      const tokens: TokenData[] = accounts
        .map((x: any) => {
          const scaledAmount = x.amount / Math.pow(10, x.decimals)
          const tokenInfo = tokenInfos.find((y) => y.address === x.mint)
          return {
            tokenAccount: x.address,
            mint: x.mint,
            amount: x.amount,
            decimals: x.decimals,
            value: x.mint,
            label: `${tokenInfo?.name} (${scaledAmount})` || x.mint,
            name: tokenInfo?.name,
          }
        })
        .filter((x: any) => x.name !== undefined);
      setTokens([
        {
          tokenAccount: publicKey!.toBase58(),
          mint: SOL_MINT,
          amount: solBalance,
          decimals: 9,
          value: SOL_MINT,
          label: `SOL (${solBalance/ 10 ** 9})`,
          name: "SOL",
        },
        ...tokens,
      ]);
    }

    if (tokenInfos.length === 0) {
      setProcessing(true);
      loadTokenInfos()
        .then(() => {
          setProcessing(false);
        })
    }

    if (connected && publicKey) {
      setProcessing(true);
      getAssetsByOwner()
        .then(() => {
          setProcessing(false);
          toast({
            title: "Loaded",
            description: "Loaded token data for " + publicKey.toBase58().substring(0, 4) + "..." + publicKey.toBase58().substring(publicKey.toBase58().length - 4),
          });
        })
        .catch((e) => {
          setProcessing(false);
          toast({
            title: "Error",
            description: e.message,
          });
        });
    }
  }, [connected, publicKey, refresh, tokenInfos]);

  // clear transction log on disconnect
  useEffect(() => {
    if (!connected && addresses.length > 0) {
      setAddresses([]);
    }
    if (!connected && tokens.length > 0) {
      setTokens([]);
    }
  }, [connected]);

  async function generateIxs(address: any, conn: Connection) {
    const amountToSend = enableVariableTokenAmounts ? address.amount : amount
    const selectedTokenInfo = tokens.find((x) => x.mint === selectedToken)!
    logger.info(`Sending ${amountToSend} tokens to ${address.address.toBase58()}`)
    address.status = "signing"
    setAddresses([...addresses])
    let createTokenAccountIx = await TransactionHelper.createTokenAccountIx({
      connectionOrConnectionManager: conn,
      mint: new PublicKey(selectedToken),
      owner: address.address,
      payer: publicKey!,
    })
    let transferIx = TransactionHelper.createSplTransferIx({
      fromTokenAccount: getAssociatedTokenAddressSync(new PublicKey(selectedToken), publicKey!),
      toTokenAccount: getAssociatedTokenAddressSync(new PublicKey(selectedToken), address.address),
      rawAmount: useRawInput ? parseInt(amountToSend.toFixed(0)) : parseInt((amountToSend * Math.pow(10, selectedTokenInfo.decimals)).toFixed(0)),
      owner: publicKey!,
    })
    return { createTokenAccountIx, transferIx }
  }

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex flex-col items-start gap-2">
        <p className="max-w-[700px] text-lg text-muted-foreground">
          verb: To distribute SOL or SPL tokens to multiple adresses. No fees.
        </p>

        <div className="flex w-full items-center justify-between">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
            SolDisperse
          </h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline'>Settings</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Endpoint</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the RPC endpoint to use for sending transactions.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Input
                      id="endpoint"
                      placeholder="Endpoint"
                      className="col-span-2 h-8"
                      value={inputValue}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setInputValue(e.target.value)
                        toast({
                          title: "Endpoint updated",
                          description: "The endpoint has been updated to " + e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
              <Separator style={{ marginTop: 20, marginBottom: 20 }} />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Commitment</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the commitment level to use for sending transactions.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Button
                      variant={commitment === 'processed' ? 'default' : 'outline'}
                      onClick={() => {
                        setCommitment('processed');
                        toast({
                          title: "Commitment updated",
                          description: "The commitment has been updated to processed",
                        });
                      }}
                    >
                      Processed
                    </Button>
                    <Button
                      variant={commitment === 'confirmed' ? 'default' : 'outline'}
                      onClick={() => {
                        setCommitment('confirmed');
                        toast({
                          title: "Commitment updated",
                          description: "The commitment has been updated to confirmed",
                        });
                      }}
                    >
                      Confirmed
                    </Button>
                    <Button
                      variant={commitment === 'finalized' ? 'default' : 'outline'}
                      onClick={() => {
                        setCommitment('finalized');
                        toast({
                          title: "Commitment updated",
                          description: "The commitment has been updated to finalized",
                        });
                      }}
                    >
                      Finalized
                    </Button>
                    <Button
                      variant={commitment === 'recent' ? 'default' : 'outline'}
                      onClick={() => {
                        setCommitment('recent');
                        toast({
                          title: "Commitment updated",
                          description: "The commitment has been updated to recent",
                        });
                      }}
                    >
                      Recent
                    </Button>
                  </div>
                </div>
              </div>
              <Separator style={{ marginTop: 20, marginBottom: 20 }} />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Variable token amounts</h4>
                  <p className="text-sm text-muted-foreground">
                    Allow variable token amounts per address.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Button
                      variant={enableVariableTokenAmounts ? 'default' : 'outline'}
                      onClick={() => {
                        setEnableVariableTokenAmounts(true);
                        toast({
                          title: "Variable token amounts updated",
                          description: "Variable token amounts have been updated to " + true,
                        });
                      }}
                    >
                      Enable
                    </Button>
                    <Button
                      variant={!enableVariableTokenAmounts ? 'default' : 'outline'}
                      onClick={() => {
                        setEnableVariableTokenAmounts(false);
                        toast({
                          title: "Variable token amounts updated",
                          description: "Variable token amounts have been updated to " + false,
                        });
                      }}
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              </div>
              <Separator style={{ marginTop: 20, marginBottom: 20 }} />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Default connection timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the default connection timeout for transactions in seconds.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Input
                      id="defaultConnectionTimeout"
                      placeholder="Default connection timeout"
                      className="col-span-2 h-8"
                      value={defaultConnectionTimeout}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setDefaultConnectionTimeout(parseFloat(e.target.value));
                        toast({
                          title: "Default connection timeout updated",
                          description: "The default connection timeout has been updated to " + e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
              <Separator style={{ marginTop: 20, marginBottom: 20 }} />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Use raw input</h4>
                  <p className="text-sm text-muted-foreground">
                    Use raw input for amounts.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Button
                      variant={useRawInput ? 'default' : 'outline'}
                      onClick={() => {
                        setUseRawInput(true);
                        toast({
                          title: "Use raw input updated",
                          description: "Use raw input has been updated to " + true,
                        });
                      }}
                    >
                      Enable
                    </Button>
                    <Button
                      variant={!useRawInput ? 'default' : 'outline'}
                      onClick={() => {
                        setUseRawInput(false);
                        toast({
                          title: "Use raw input updated",
                          description: "Use raw input has been updated to " + false,
                        });
                      }}
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              </div>

              <Separator style={{ marginTop: 20, marginBottom: 20 }} />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Priority fee rate</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the priority fee rate for transactions.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Input
                      id="priorityFeeRate"
                      placeholder="Priority fee rate"
                      className="col-span-2 h-8"
                      value={priorityRate}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setPriorityRate(parseFloat(e.target.value));
                        toast({
                          title: "Priority fee rate updated",
                          description: "The priority fee rate has been updated to " + e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator style={{ marginTop: 20, marginBottom: 20 }} />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Delay between batches</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the delay between batches in seconds.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Input
                      id="delayBetweenBatches"
                      placeholder="Delay between batches"
                      className="col-span-2 h-8"
                      value={delayBetweenBatches}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setDelayBetweenBatches(parseFloat(e.target.value));
                        toast({
                          title: "Delay between batches updated",
                          description: "The delay between batches has been updated to " + e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Separator />
      <div className="grid w-full gap-2">
        <div className="grid w-full gap-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-2xl">
            Enter RPC endpoint
          </h1>
          <div className="max-w-[700px] text-base text-muted-foreground">
            <div className="inline-block">
              Step 0: Enter your RPC endpoint. You can get one over at <a href="https://helius.xyz" target="_blank" rel="noreferrer" className="text-blue-500 underline">Helius</a>.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 items-center gap-4 pb-4">
          <Input
            id="endpoint"
            placeholder="Endpoint"
            className="col-span-2 h-8"
            value={inputValue}
            onChange={(e) => {
              console.log(e.target.value);
              setInputValue(e.target.value)
              toast({
                title: "Endpoint updated",
                description: "The endpoint has been updated to " + e.target.value,
              });
            }}
          />
        </div>
        <div className="grid w-full gap-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-2xl">
            Select a token
          </h1>
          <div className="max-w-[700px] text-base text-muted-foreground">
            <div className="inline-block">
              Step 1: Select a token to disperse.
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <TokenSelector
              tokens={tokens}
              value={selectedToken}
              setValue={setSelectedToken}
            />
            <Button
              variant='default'
              onClick={() => {
                setRefresh(!refresh)
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>
      <div className="grid w-full gap-2">
        <div className="grid w-full gap-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-2xl">
            Enter amount
          </h1>
          <div className="max-w-[700px] text-lg text-muted-foreground">
            <div className="inline-block pr-4 text-base">
              Step 2: Enter the amount of tokens to disperse per address.
            </div>
          </div>
        </div>
        <Input
          type="number"
          placeholder="Amount of tokens"
          onChange={(e) => {
            setAmount(parseFloat(e.target.value || "") || 0)
          }}
          value={amount}
          disabled={enableVariableTokenAmounts}
        />
      </div>
      <div className="grid w-full gap-2">
        <div className="grid w-full gap-0">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-2xl">
            Enter addresses
          </h1>
          <div className="max-w-[700px] text-base text-muted-foreground">
            <div className="inline-block pr-4">
              Step 3: Enter the addresses to disperse tokens to.
            </div>
          </div>
        </div>
        <Textarea
          placeholder={enableVariableTokenAmounts ? 'address1,amount1\naddress2,amount2\naddress3,amount3' : "address1\naddress2\naddress3"}
          onChange={(e) => {
            if (!enableVariableTokenAmounts) {
              // try to parse addresses as public keys
              const addresses = e.target.value
                .split("\n")
                .map((x) => {
                  try {
                    return new PublicKey(x)
                  } catch (e) {
                    return null
                  }
                })
                .filter((x) => x !== null)
                .map((x: PublicKey | null) => {
                  return {
                    address: x!,
                    amount: amount,
                    status: "pending" as TransactionStatus,
                  }
                }) as TransactionRecord[];
              setAddresses(addresses)
            } else {
              // try to parse addresses as public keys
              const addresses = e.target.value
                .split("\n")
                .map((line: string) => {
                  try {
                    const address = line.split(',')[0];
                    const amount = parseFloat(line.split(',')[1]);
                    console.log(address, amount);
                    return {
                      address: new PublicKey(address),
                      amount: amount,
                      status: "pending" as TransactionStatus,
                    }
                  } catch (e) {
                    return {
                      address: PublicKey.default,
                      amount: 0,
                      status: "pending" as TransactionStatus,
                    }
                  }
                })
                .filter((x) => x.address !== null && x.address !== PublicKey.default && x.amount !== 0)
                .map((x: TransactionRecord) => {
                  return {
                    address: x.address!,
                    amount: x.amount,
                    status: "pending" as TransactionStatus,
                  }
                }) as TransactionRecord[];
              setAddresses(addresses)
            }
          }}
        />
        <Button
          disabled={!connected}
          onClick={async () => {
            if (addresses.length === 0) {
              toast({
                title: "No addresses",
                description: "Please enter at least one address.",
              })
              return
            }

            if (amount === 0 && !enableVariableTokenAmounts) {
              toast({
                title: "No amount",
                description: "Please enter an amount.",
              })
              return
            }

            if (selectedToken === "") {
              toast({
                title: "No token",
                description: "Please select a token.",
              })
              return
            }

            if (publicKey === null || signAllTransactions === undefined) {
              toast({
                title: "No wallet",
                description: "Please connect a wallet.",
              })
              return
            }

            setProcessing(true)
            try {
              console.log(`Endpoint: ${inputValue}`);
              const config = {
                commitment: commitment,
                confirmTransactionInitialTimeout: defaultConnectionTimeout * 1000,
              };
              const txs: Transaction[] = [];
              const conn = new Connection(inputValue, config);
              const recentBlockhash = (await conn.getLatestBlockhashAndContext('max')).value.blockhash;

              // generate transactions
              if (selectedToken === SOL_MINT) {
                // bundle 20 addresses per transaction
                const chunks = chunkArray(addresses, 20);
                for (let i = 0; i < chunks.length; i++) {
                  const chunk = chunks[i];
                  const ixs = chunk.map((address) => {
                    return SystemProgram.transfer({
                      fromPubkey: publicKey,
                      toPubkey: address.address,
                      lamports: useRawInput ? amount : amount * LAMPORTS_PER_SOL,
                    });
                  });
                  const tx = TransactionBuilder.create()
                    .addIx(ixs)
                    .addIx(priorityFeeIx)
                    .build();
                  tx.recentBlockhash = recentBlockhash;
                  tx.feePayer = publicKey;
                  console.log(TransactionHelper.getTxSize(tx, publicKey));
                  txs.push(tx);
                  logger.info(`Generated transaction for chunk ${i + 1} of ${chunks.length}`);
                  // update status
                  for (let j = 0; j < chunk.length; j++) {
                    chunk[j].status = "signing";
                  }
                }
              } else {
                // bundle 4 addresses per transaction
                const chunks = chunkArray(addresses, 10);
                for (let i = 0; i < chunks.length; i++) {
                  const chunk = chunks[i];
                  const ixs = (await Promise.all(chunk.map(async (address) => {
                    const subixs = [];
                    // wrap in try catch to avoid breaking when attemping to send to an off the curve address
                    try {
                      let { createTokenAccountIx, transferIx } = await generateIxs(address, conn);
                      if (createTokenAccountIx !== null) { subixs.push(createTokenAccountIx); }
                      if (transferIx) { subixs.push(transferIx); }
                    } catch (e: any) {
                      logger.error(`Error processing address: ${address.address.toBase58()}`, e);
                      address.status = "error";
                    }
                    return subixs;
                  }))).flat();
                  const tx = TransactionBuilder.create()
                    .addIx(ixs)
                    .addIx(priorityFeeIx)
                    .build();
                  tx.recentBlockhash = recentBlockhash;
                  tx.feePayer = publicKey;
                  console.log(TransactionHelper.getTxSize(tx, publicKey));
                  txs.push(tx);
                  logger.info(`Generated transaction for chunk ${i + 1} of ${chunks.length}`);

                  await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches * 1000));
                }
              }

              logger.info(`Signing ${txs.length} transactions`);
              const signedTxs = await signAllTransactions(txs);
              logger.info(`Signed ${signedTxs.length} transactions`);

              // send transactions
              const sigs = [];
              for (let i = 0; i < signedTxs.length; i++) {
                const tx = signedTxs[i];
                // update status
                const involvedAddresses = tx.instructions.map((ix) => { return ix.keys.map((key) => key.pubkey.toBase58()) }).flat();                
                for (let j = 0; j < addresses.length; j++) {
                  // find the address that corresponds to this txid
                  if (involvedAddresses.includes(addresses[j].address.toBase58())) {
                    addresses[j].status = "sending";
                  }
                }
                setAddresses([...addresses]);

                logger.info(`Sending transaction ${i + 1} of ${signedTxs.length}`);
                try {
                  const txid = await conn.sendRawTransaction(tx.serialize());
                  sigs.push(txid);
                  logger.info(`Sent transaction ${i + 1} of ${signedTxs.length}`, txid);

                  // update status
                  for (let j = 0; j < addresses.length; j++) {
                    // find the address that corresponds to this txid
                    if (involvedAddresses.includes(addresses[j].address.toBase58()) && addresses[j].txId === undefined) {
                      addresses[j].status = "confirming";
                      addresses[j].txId = txid;
                    }
                  }
                  setAddresses([...addresses]);

                  toast({
                    title: "Transaction sent",
                    description: `Transaction ${i + 1} of ${signedTxs.length} sent`,
                  });
                } catch (e: any) {
                  addresses[i].status = "error";
                  setAddresses([...addresses]);
                  logger.error(`Error sending transaction ${i + 1} of ${signedTxs.length}`, e);
                  toast({
                    title: "Error",
                    description: e.message,
                  });
                }
              }

              // confirm transactions in parallel
              await Promise.all(sigs.map(async (txid, index) => {
                logger.info(`Confirming transaction ${index + 1} of ${signedTxs.length}`);
                try {
                  // confirm transaction
                  await TransactionWrapper.confirmTx({
                    connection: conn,
                    signature: txid,
                    commitment
                  });
                  // find the address that corresponds to this txid
                  for (let j = 0; j < addresses.length; j++) {
                    if (addresses[j].txId === txid) {
                      addresses[j].status = "confirmed";
                    }
                  }
                  setAddresses([...addresses]);
                  logger.info(`Confirmed transaction ${index + 1} of ${signedTxs.length}`, txid);
                  toast({
                    title: "Transaction confirmed",
                    description: `Transaction ${index + 1} of ${signedTxs.length} confirmed`,
                  })
                } catch (e: any) {
                  // find the address that corresponds to this txid
                  for (let j = 0; j < addresses.length; j++) {
                    if (addresses[j].txId === txid) {
                      addresses[j].status = "error";
                    }
                  }
                  setAddresses([...addresses]);
                  logger.error(`Error sending transaction ${index + 1} of ${signedTxs.length}`, e);
                  toast({
                    title: "Error",
                    description: e.message,
                  })
                }
              }));

            } catch (e: any) {
              toast({
                title: "Error",
                description: e.message,
              });
              logger.error(e);
            }

            setProcessing(false);
            setRefresh(!refresh);

            
          }}
        >
          {!processing &&
            `Disperse token${amount > 1 ? "s" : ""} to ${
              addresses.length
            } address${addresses.length > 1 ? "es" : ""}`}
          {processing && (
            <Spinner size="small" className="dark:text-gray-600" />
          )}
        </Button>
      </div>
      <Separator />
      <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-2xl">
        Transaction log {addresses.length > 0 && `(${addresses.length})`}
      </h1>
      <Table>
        <TableCaption>
          The transaction log above will update as transactions are sent.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead className="w-[100px]">Address</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>TX ID</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addresses.map((address, index) => {
            return (
              <TableRow>
                <TableCell className="font-medium">
                  {index}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`https://solana.fm/address/${address.address.toBase58()}?cluster=mainnet-alpha`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline"
                    >
                      {address.address.toBase58().substring(0, 24)}...
                    </a>
                    <Button size='sm' variant='outline' onClick={() => {
                      navigator.clipboard.writeText(address.address.toBase58());
                      toast({
                        title: "Copied",
                        description: `Address copied to clipboard`,
                      });
                    }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{address.amount}</TableCell>
                <TableCell className="text-right">
                  {address.txId && (
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`https://solana.fm/tx/${address.txId}?cluster=mainnet-alpha`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 underline"
                      >
                        {address.txId.substring(0, 52)}...
                      </a>
                      <Button size='sm' variant='outline' onClick={() => {
                        navigator.clipboard.writeText(address.txId!);
                        toast({
                          title: "Copied",
                          description: `Transaction ID copied to clipboard`,
                        });
                      }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      address.status === "pending"
                        ? "outline"
                        : address.status === "signing"
                        ? "secondary"
                        : address.status === "sending"
                        ? "secondary"
                        : address.status === "confirming"
                        ? "secondary"
                        : address.status === "confirmed"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {address.status.toString()}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}

export type TransactionStatus =
  | "pending"
  | "signing"
  | "sending"
  | "confirming"
  | "confirmed"
  | "error"
type SpinnerProps = {
  className?: string
  size?: "small" | "medium" | "large"
}
function Spinner({ className, size = "medium" }: SpinnerProps) {
  return (
    <div role="status" className={className}>
      <svg
        aria-hidden="true"
        className={cn("animate-spin fill-black text-gray-200", {
          "h-4 w-4": size === "small",
          "h-8 w-8": size === "medium",
          "h-12 w-12": size === "large",
        })}
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

function chunkArray(array: any[], len: number): any[][] {
  var chunks: any[] = [],
    i = 0,
    n = array.length;

  while (i < n) {
    chunks.push(array.slice(i, (i += len)));
  }

  return chunks;
}