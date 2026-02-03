import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

const RPC = process.env.HELIUS_RPC || 'https://api.mainnet-beta.solana.com'

// Liquid staking tokens (approximate SOL value)
const STAKED_SOL_TOKENS: Record<string, string> = {
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',      // Marinade
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jitoSOL',  // Jito
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',      // BlazeStake
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stSOL',    // Lido
  'he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A': 'hSOL',      // Helius
  'LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp': 'LST',       // Sanctum LST
}

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
    stakedSol: number
    totalSolValue: number
    tokenCount: number
    nftCount: number
    txCount: number
    oldestTxDays: number
    lastActiveDays: number
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
  
  // Analyze token accounts for staked SOL and NFTs
  let stakedSol = 0
  let nftCount = 0
  let fungibleTokenCount = 0
  
  for (const account of tokenAccounts.value) {
    const parsed = account.account.data.parsed?.info
    if (!parsed) continue
    
    const mint = parsed.mint
    const amount = parsed.tokenAmount?.uiAmount || 0
    const decimals = parsed.tokenAmount?.decimals || 0
    
    // Check if it's a staked SOL token
    if (STAKED_SOL_TOKENS[mint] && amount > 0) {
      stakedSol += amount // These are roughly 1:1 with SOL
    }
    
    // Check if it's an NFT (decimals = 0, amount = 1)
    if (decimals === 0 && amount === 1) {
      nftCount++
    } else if (amount > 0) {
      fungibleTokenCount++
    }
  }
  
  const totalSolValue = solBalance + stakedSol
  
  // Calculate age score (0-25)
  let ageScore = 0
  let oldestTxDays = 0
  let lastActiveDays = 0
  if (signatures.length > 0) {
    const oldestTx = signatures[signatures.length - 1]
    const newestTx = signatures[0]
    if (oldestTx.blockTime) {
      oldestTxDays = Math.floor((Date.now() / 1000 - oldestTx.blockTime) / 86400)
      ageScore = Math.min(25, Math.floor(oldestTxDays / 30) * 5)
    }
    if (newestTx.blockTime) {
      lastActiveDays = Math.floor((Date.now() / 1000 - newestTx.blockTime) / 86400)
    }
  }
  
  // Calculate activity score (0-25)
  const txCount = signatures.length
  const activityScore = Math.min(25, Math.floor(txCount / 10) * 5)
  
  // Calculate balance score (0-25) - based on TOTAL SOL value (liquid + staked)
  let balanceScore = 0
  if (totalSolValue >= 100) balanceScore = 25
  else if (totalSolValue >= 50) balanceScore = 20
  else if (totalSolValue >= 10) balanceScore = 15
  else if (totalSolValue >= 1) balanceScore = 10
  else if (totalSolValue >= 0.1) balanceScore = 5
  
  // Calculate diversity score (0-25) - tokens + NFT bonus
  const uniqueTokens = tokenAccounts.value.length
  const nftBonus = Math.min(5, Math.floor(nftCount / 5)) // Up to 5 bonus points for NFTs
  const diversityScore = Math.min(25, (fungibleTokenCount * 3) + nftBonus)
  
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
      stakedSol: Math.round(stakedSol * 1000) / 1000,
      totalSolValue: Math.round(totalSolValue * 1000) / 1000,
      tokenCount: fungibleTokenCount,
      nftCount,
      txCount,
      oldestTxDays,
      lastActiveDays,
    }
  }
}
