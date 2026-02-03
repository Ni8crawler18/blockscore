import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

const RPC = process.env.HELIUS_RPC || 'https://api.mainnet-beta.solana.com'

export interface ScoreResult {
  score: number
  grade: string
  breakdown: {
    age: number
    activity: number
    balance: number
    diversity: number
  }
  wallet: string
  stats: {
    solBalance: number
    tokenCount: number
    txCount: number
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
  
  // Get SOL balance
  const balance = await conn.getBalance(pubkey)
  const solBalance = balance / LAMPORTS_PER_SOL
  
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
  
  // Calculate balance score (0-25) - shows skin in the game
  let balanceScore = 0
  if (solBalance >= 100) balanceScore = 25
  else if (solBalance >= 50) balanceScore = 20
  else if (solBalance >= 10) balanceScore = 15
  else if (solBalance >= 1) balanceScore = 10
  else if (solBalance >= 0.1) balanceScore = 5
  
  // Calculate diversity score (0-25)
  const uniqueTokens = tokenAccounts.value.length
  const diversityScore = Math.min(25, uniqueTokens * 3)
  
  const totalScore = ageScore + activityScore + balanceScore + diversityScore
  
  return {
    score: totalScore,
    grade: getGrade(totalScore),
    breakdown: {
      age: ageScore,
      activity: activityScore,
      balance: balanceScore,
      diversity: diversityScore,
    },
    wallet: walletAddress,
    stats: {
      solBalance: Math.round(solBalance * 1000) / 1000,
      tokenCount: uniqueTokens,
      txCount,
      oldestTxDays,
    }
  }
}
