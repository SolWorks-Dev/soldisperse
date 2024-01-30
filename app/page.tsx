"use client"

import { useEffect, useState } from "react"
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"
import { TokenInfo } from "@solana/spl-token-registry"
import { useWallet } from "@solana/wallet-adapter-react"
import { Commitment, Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js"
import {
  Logger,
  TransactionBuilder,
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

const logger = new Logger("core");
export interface TokenData {
  tokenAccount: string
  mint: string
  amount: number
  decimals: number
  value: string
  label: string
};
export type TransactionRecord = {
  address: PublicKey;
  amount: number;
  status: TransactionStatus;
  txId?: string;
};

export default function IndexPage() {
  const { publicKey, connected, signAllTransactions } = useWallet();
  const [refresh, setRefresh] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [addresses, setAddresses] = useState<TransactionRecord[]>([]);
  const [tokenInfos, setTokenInfos] = useState<TokenInfo[]>([]);
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>('https://racial-ibbie-fast-mainnet.helius-rpc.com/');
  const [commitment, setCommitment] = useState<Commitment>('processed');
  const [enableVariableTokenAmounts, setEnableVariableTokenAmounts] = useState<boolean>(false);
  const [defaultConnectionTimeout, setDefaultConnectionTimeout] = useState<number>(120);

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
      }];
      setTokenInfos(tokenList);
    }

    const getAssetsByOwner = async () => {
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${publicKey!.toBase58()}/balances?api-key=1b9c8608-b054-4f30-ab1b-cdbbfaba6e5f`
      )
      const result = await response.json()
      const accounts = result.tokens.filter((x: any) => x.amount > 0)
      const tokens = accounts.map((x: any) => {
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
      setTokens(tokens.filter((x: any) => x.name !== undefined))
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
        })
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

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex flex-col items-start gap-2">
        <p className="max-w-[700px] text-lg text-muted-foreground">
          verb: To distribute SPL tokens to multiple adresses.
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
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Separator />
      <div className="grid w-full gap-2">
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
          <div className="inline-block p-0">
            <TokenSelector
              tokens={tokens}
              value={selectedToken}
              setValue={setSelectedToken}
            />
          </div>
          <div className="inline-block pl-2">
            <Button
              variant="ghost"
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
              const senderAta = getAssociatedTokenAddressSync(new PublicKey(selectedToken), publicKey);
              const txs: Transaction[] = [];
              const conn = new Connection(inputValue, {
                commitment: commitment,
                confirmTransactionInitialTimeout: defaultConnectionTimeout * 1000,
              });
              const recentBlockhash = (await conn.getLatestBlockhashAndContext('max')).value.blockhash;

              // generate transactions
              for (let i = 0; i < addresses.length; i++) {
                const address = addresses[i];
                const amountToSend = enableVariableTokenAmounts ? address.amount : amount;
                const selectedTokenInfo = tokens.find((x) => x.mint === selectedToken)!;
                logger.info(`Sending ${amountToSend} tokens to ${address.address.toBase58()}`);
                address.status = "sending";
                setAddresses([...addresses]);
                try {
                  let ata = getAssociatedTokenAddressSync(new PublicKey(selectedToken), address.address);
                  let associatedAddrIx;
                  try {
                    await getAccount(conn, ata);
                  } catch (e) {
                    associatedAddrIx = createAssociatedTokenAccountInstruction(
                      publicKey,
                      ata,
                      address.address,
                      new PublicKey(selectedToken)
                    );
                  }
                  const tx = TransactionBuilder.create()
                    .addIx(associatedAddrIx ? associatedAddrIx : [])
                    .addSplTransferIx({
                      fromTokenAccount: senderAta,
                      toTokenAccount: ata,
                      rawAmount: amountToSend * Math.pow(10, selectedTokenInfo.decimals),
                      owner: publicKey,
                    })
                    .addMemoIx({
                      memo: `Dispersed ${amountToSend} ${selectedToken} to ${address.address.toBase58()}. Powered by SolDisperse by SolWorks.`,
                      signer: publicKey,
                    })
                    .build();
                  tx.recentBlockhash = recentBlockhash;
                  tx.feePayer = publicKey;
                  txs.push(tx);
                  logger.info(`Generated transaction for ${address.address.toBase58()}`);
                } catch (e: any) {
                  address.status = "error";
                  setAddresses([...addresses]);
                  logger.error(`Error sending transaction to ${address.address.toBase58()}`, e);
                  toast({
                    title: "Error",
                    description: e.message,
                  });
                }
              }

              logger.info(`Signing ${txs.length} transactions`);
              const signedTxs = await signAllTransactions(txs);
              logger.info(`Signed ${signedTxs.length} transactions`);

              // send transactions
              for (let i = 0; i < signedTxs.length; i++) {
                const tx = signedTxs[i];
                addresses[i].status = "sending";
                setAddresses([...addresses]);
                logger.info(`Sending transaction ${i + 1} of ${signedTxs.length}`);
                try {
                  const txid = await conn.sendRawTransaction(tx.serialize());
                  logger.info(`Sent transaction ${i + 1} of ${signedTxs.length}`, txid);
                  addresses[i].status = "confirming";
                  addresses[i].txId = txid;
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

              // confirm transactions
              for (let i = 0; i < addresses.length; i++) {
                const entry = addresses[i];
                if (entry.status === "confirming" && entry.txId) {
                  logger.info(`Confirming transaction ${i + 1} of ${signedTxs.length}`);
                  try {
                    const txid = entry.txId!;
                    await conn.confirmTransaction(txid, commitment);
                    addresses[i].status = "confirmed";
                    setAddresses([...addresses]);
                    logger.info(`Confirmed transaction ${i + 1} of ${signedTxs.length}`, txid);
                    toast({
                      title: "Transaction confirmed",
                      description: `Transaction ${i + 1} of ${signedTxs.length} confirmed`,
                    })
                  } catch (e: any) {
                    addresses[i].status = "error";
                    setAddresses([...addresses]);
                    logger.error(`Error sending transaction ${i + 1} of ${signedTxs.length}`, e);
                    toast({
                      title: "Error",
                      description: e.message,
                    })
                  }
                }
              }

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
            <TableHead className="text-right">TX ID</TableHead>
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
