import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js'

const RPC = process.env.HELIUS_RPC || 'https://api.mainnet-beta.solana.com'

// Known DeFi programs
const DEFI_PROGRAMS = new Set([
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',  // Jupiter
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', // Kamino
  'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',  // Marinade
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
  const conn = new Connection(RPC)
  const pubkey = new PublicKey(walletAddress)
  
  // Get account info
  const accountInfo = await conn.getAccountInfo(pubkey)
  if (!accountInfo) throw new Error('Wallet not found')
  
  // Get recent signatures
  const signatures = await conn.getSignaturesForAddress(pubkey, { limit: 100 })
  
  // Get token accounts
  const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
  })
  
  // Calculate age score (0-25)
  let ageScore = 0
  if (signatures.length > 0) {
    const oldestTx = signatures[signatures.length - 1]
    if (oldestTx.blockTime) {
      const ageInDays = (Date.now() / 1000 - oldestTx.blockTime) / 86400
      ageScore = Math.min(25, Math.floor(ageInDays / 30) * 5) // 5 pts per month, max 25
    }
  }
  
  // Calculate activity score (0-25)
  const txCount = signatures.length
  const activityScore = Math.min(25, Math.floor(txCount / 10) * 5) // 5 pts per 10 tx
  
  // Calculate DeFi score (0-25)
  let defiCount = 0
  for (const sig of signatures.slice(0, 50)) {
    try {
      const tx = await conn.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 })
      if (tx?.transaction.message.accountKeys) {
        for (const key of tx.transaction.message.accountKeys) {
          const addr = typeof key === 'string' ? key : key.pubkey.toString()
          if (DEFI_PROGRAMS.has(addr)) {
            defiCount++
            break
          }
        }
      }
    } catch {}
  }
  const defiScore = Math.min(25, defiCount * 2) // 2 pts per DeFi tx
  
  // Calculate diversity score (0-25)
  const uniqueTokens = tokenAccounts.value.length
  const diversityScore = Math.min(25, uniqueTokens * 3) // 3 pts per token type
  
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
  }
}
