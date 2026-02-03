import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js'

const RPC = process.env.HELIUS_RPC || 'https://api.mainnet-beta.solana.com'
const TX_SAMPLE_SIZE = 25
const TX_TIMEOUT_MS = 8000

// Comprehensive DeFi programs list
const DEFI_PROGRAMS = new Set([
  // DEXs
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',  // Jupiter v6
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',  // Jupiter v4
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', // Raydium CLMM
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',  // Orca Whirlpool
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca v2
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',  // Serum/OpenBook
  'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',  // OpenBook v2
  'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',  // Phoenix
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',  // Meteora DLMM
  'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UG', // Meteora Pools
  
  // Lending
  'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',  // Solend
  'MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA',  // MarginFi
  'KLend2g3cP87ber41NAf5rdDjKGFxfGLNtHvTrLYWuk',  // Kamino Lending
  
  // Liquid Staking
  'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',  // Marinade
  'SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy',  // Stake Pool (Socean, etc)
  'stkitrT1Uoy18Dk1fTrgPw8W6MVzoCfYoAFT4MLsmhq',  // Sanctum
  'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb',  // Jito
  
  // Perps/Derivatives  
  'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',  // Drift
  'FUfpR31LmcP1VSbz5zDaM7nxnH55iBHkpwusgrnhaFjL', // Mango v4
  'ZETAxsqBRek56DhiGXrn75yj2NHU3aYUnxvHXpkf3aD',  // Zeta
  
  // NFT Marketplaces
  'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN',  // Tensor
  'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',  // Magic Eden v2
  'hadeK9DLv9eA7ya5KCTqSvSvRZeJC3JgD5a9Y3CNbvu',  // Hadeswap
  
  // Others
  'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',  // Wormhole
  'JCFRaPv7852ESRwJJGRy2mysUMydXZgVVhrMLmExvmVp', // Pyth
])

export interface ScoreResult {
  score: number
  grade: string
  breakdown: {
    age: number
    activity: number
    defi: number
    diversity: number
  }
  wallet: string
  stats: {
    totalTxAnalyzed: number
    defiTxFound: number
    tokenCount: number
    oldestTxDays: number
  }
}

function getGrade(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

export async function calculateScore(walletAddress: string): Promise<ScoreResult> {
  const conn = new Connection(RPC, { commitment: 'confirmed' })
  const pubkey = new PublicKey(walletAddress)
  
  // Get recent signatures
  const signatures = await conn.getSignaturesForAddress(pubkey, { limit: 100 })
  if (signatures.length === 0) throw new Error('No activity found for this wallet')
  
  // Get token accounts
  const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
  })
  
  // Calculate age score (0-25)
  let ageScore = 0
  let oldestTxDays = 0
  if (signatures.length > 0) {
    const oldestTx = signatures[signatures.length - 1]
    if (oldestTx.blockTime) {
      oldestTxDays = Math.floor((Date.now() / 1000 - oldestTx.blockTime) / 86400)
      ageScore = Math.min(25, Math.floor(oldestTxDays / 30) * 5)
    }
  }
  
  // Calculate activity score (0-25)
  const txCount = signatures.length
  const activityScore = Math.min(25, Math.floor(txCount / 10) * 5)
  
  // Calculate DeFi score (0-25) - parallel fetch with timeout
  const fetchWithTimeout = async (signature: string): Promise<ParsedTransactionWithMeta | null> => {
    try {
      const tx = await Promise.race([
        conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 }),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), TX_TIMEOUT_MS))
      ])
      return tx
    } catch {
      return null
    }
  }

  const txResults = await Promise.allSettled(
    signatures.slice(0, TX_SAMPLE_SIZE).map(sig => fetchWithTimeout(sig.signature))
  )

  let defiCount = 0
  let txAnalyzed = 0
  
  for (const result of txResults) {
    if (result.status !== 'fulfilled' || !result.value) continue
    txAnalyzed++
    const tx = result.value
    
    // Check account keys
    if (tx?.transaction.message.accountKeys) {
      for (const key of tx.transaction.message.accountKeys) {
        const addr = typeof key === 'string' ? key : key.pubkey.toString()
        if (DEFI_PROGRAMS.has(addr)) {
          defiCount++
          break
        }
      }
    }
    
    // Also check inner instructions for program calls
    if (tx?.meta?.innerInstructions) {
      for (const inner of tx.meta.innerInstructions) {
        for (const ix of inner.instructions) {
          if ('programId' in ix && DEFI_PROGRAMS.has(ix.programId.toString())) {
            defiCount++
            break
          }
        }
      }
    }
  }
  
  const defiScore = Math.min(25, Math.floor(defiCount * 1.5))
  
  // Calculate diversity score (0-25)
  const uniqueTokens = tokenAccounts.value.length
  const diversityScore = Math.min(25, uniqueTokens * 3)
  
  const totalScore = ageScore + activityScore + defiScore + diversityScore
  
  return {
    score: totalScore,
    grade: getGrade(totalScore),
    breakdown: {
      age: ageScore,
      activity: activityScore,
      defi: defiScore,
      diversity: diversityScore,
    },
    wallet: walletAddress,
    stats: {
      totalTxAnalyzed: txAnalyzed,
      defiTxFound: defiCount,
      tokenCount: uniqueTokens,
      oldestTxDays,
    }
  }
}
