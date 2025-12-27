export interface JupiterToken {
  address: string
  chainId: number
  decimals: number
  name: string
  symbol: string
  logoURI?: string
  tags?: string[]
  extensions?: Record<string, string>
}

const JUPITER_TOKEN_LIST_URL = "https://token.jup.ag/all"
const JUPITER_STRICT_LIST_URL = "https://token.jup.ag/strict"

const CACHE_KEY = "soldisperse_jupiter_tokens"
const CACHE_VERSION = "2"
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface CachedTokenList {
  version: string
  timestamp: number
  data: JupiterToken[]
}

export async function fetchJupiterTokenList(
  strict: boolean = false
): Promise<JupiterToken[]> {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsedCache: CachedTokenList = JSON.parse(cached)
      const isExpired = Date.now() - parsedCache.timestamp > CACHE_TTL
      if (parsedCache.version === CACHE_VERSION && !isExpired) {
        return parsedCache.data
      }
    }

    const url = strict ? JUPITER_STRICT_LIST_URL : JUPITER_TOKEN_LIST_URL
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch token list: ${response.statusText}`)
    }

    const tokens: JupiterToken[] = await response.json()

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: tokens,
      })
    )

    return tokens
  } catch (error) {
    console.error("Error fetching Jupiter token list:", error)

    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsedCache: CachedTokenList = JSON.parse(cached)
      return parsedCache.data
    }

    return []
  }
}

export function getTokenByMint(
  tokens: JupiterToken[],
  mint: string
): JupiterToken | undefined {
  return tokens.find((t) => t.address === mint)
}

export function searchTokens(
  tokens: JupiterToken[],
  query: string
): JupiterToken[] {
  if (!query.trim()) return tokens

  const lowerQuery = query.toLowerCase()
  return tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(lowerQuery) ||
      t.name.toLowerCase().includes(lowerQuery) ||
      t.address.toLowerCase().includes(lowerQuery)
  )
}

export function clearJupiterCache(): void {
  localStorage.removeItem(CACHE_KEY)
}

