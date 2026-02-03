import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js'

const RPC = process.env.HELIUS_RPC || 'https://api.mainnet-beta.solana.com'
const TX_SAMPLE_SIZE = 15  // Reduced to avoid rate limits
const TX_TIMEOUT_MS = 12000 // Increased timeout
const BATCH_SIZE = 5 // Fetch in smaller batches
const BATCH_DELAY_MS = 500 // Delay between batches

// Comprehensive DeFi programs list
const DEFI_PROGRAMS = new Set([
  // DEXs
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',  // Jupiter v6
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',  // Jupiter v4
  'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph',  // Jupiter v3
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', // Raydium CLMM
  '27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv', // Raydium v4
  'routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS',  // Raydium Router
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',  // Orca Whirlpool
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca v2
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',  // Serum v3
  'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',  // OpenBook v2
  'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',  // Phoenix
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',  // Meteora DLMM
  'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UG', // Meteora Pools
  
  // Lending
  'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',  // Solend
  'MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA',  // MarginFi
  'KLend2g3cP87ber41NAf5rdDjKGFxfGLNtHvTrLYWuk',  // Kamino Lending
  'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1', // Drift Lending
  
  // Liquid Staking
  'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',  // Marinade
  'SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy',  // Stake Pool
  'stkitrT1Uoy18Dk1fTrgPw8W6MVzoCfYoAFT4MLsmhq',  // Sanctum
  'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb',  // Jito
  
  // Perps/Derivatives  
  'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',  // Drift
  'FUfpR31LmcP1VSbz5zDaM7nxnH55iBHkpwusgrnhaFjL', // Mango v4
  'mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68',  // Mango v3
  'ZETAxsqBRek56DhiGXrn75yj2NHU3aYUnxvHXpkf3aD',  // Zeta
  'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu',  // Perpetuals
  
  // NFT Marketplaces
  'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN',  // Tensor
  'TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp',  // Tensor cNFT
  'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',  // Magic Eden v2
  'hadeK9DLv9eA7ya5KCTqSvSvRZeJC3JgD5a9Y3CNbvu',  // Hadeswap
  'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk',  // Haus
  
  // Others
  'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',  // Wormhole
  'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb',  // Wormhole Bridge
  'JCFRaPv7852ESRwJJGRy2mysUMydXZgVVhrMLmExvmVp', // Pyth
  'BPFLoaderUpgradeab1e11111111111111111111111',   // Upgradeable programs
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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function calculateScore(walletAddress: string): Promise<ScoreResult> {
  const conn = new Connection(RPC, { 
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  })
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
  
  // Fetch transactions in batches to avoid rate limiting
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

  const sigsToFetch = signatures.slice(0, TX_SAMPLE_SIZE)
  const txResults: (ParsedTransactionWithMeta | null)[] = []
  
  // Fetch in batches with delay
  for (let i = 0; i < sigsToFetch.length; i += BATCH_SIZE) {
    const batch = sigsToFetch.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(sig => fetchWithTimeout(sig.signature))
    )
    txResults.push(...batchResults)
    
    // Add delay between batches (except for last batch)
    if (i + BATCH_SIZE < sigsToFetch.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  let defiCount = 0
  let txAnalyzed = 0
  const detectedPrograms: string[] = []
  
  for (const tx of txResults) {
    if (!tx) continue
    txAnalyzed++
    
    let foundDefi = false
    
    // Check account keys
    if (tx.transaction.message.accountKeys) {
      for (const key of tx.transaction.message.accountKeys) {
        const addr = typeof key === 'string' ? key : key.pubkey.toString()
        if (DEFI_PROGRAMS.has(addr)) {
          foundDefi = true
          detectedPrograms.push(addr)
          break
        }
      }
    }
    
    // Check inner instructions
    if (!foundDefi && tx.meta?.innerInstructions) {
      for (const inner of tx.meta.innerInstructions) {
        for (const ix of inner.instructions) {
          const programId = 'programId' in ix ? ix.programId.toString() : ''
          if (DEFI_PROGRAMS.has(programId)) {
            foundDefi = true
            detectedPrograms.push(programId)
            break
          }
        }
        if (foundDefi) break
      }
    }
    
    // Also check logs for program invocations
    if (!foundDefi && tx.meta?.logMessages) {
      for (const log of tx.meta.logMessages) {
        if (log.includes('Program ') && log.includes(' invoke')) {
          const match = log.match(/Program ([A-Za-z0-9]{32,44}) invoke/)
          if (match && DEFI_PROGRAMS.has(match[1])) {
            foundDefi = true
            detectedPrograms.push(match[1])
            break
          }
        }
      }
    }
    
    if (foundDefi) defiCount++
  }
  
  console.log(`[BlockScore] Wallet: ${walletAddress.slice(0,8)}... | Analyzed: ${txAnalyzed} | DeFi: ${defiCount} | Programs: ${detectedPrograms.join(', ') || 'none'}`)
  
  // Scale DeFi score based on analyzed ratio
  const analyzeRatio = txAnalyzed / TX_SAMPLE_SIZE
  const adjustedDefiCount = analyzeRatio > 0 ? Math.round(defiCount / analyzeRatio) : defiCount
  const defiScore = Math.min(25, Math.floor(adjustedDefiCount * 1.5))
  
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
