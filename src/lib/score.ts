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

// Badge definitions
export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ScoreReason {
  score: number
  maxScore: number
  reason: string
  details: string
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
  reasons: {
    age: ScoreReason
    activity: ScoreReason
    balance: ScoreReason
    diversity: ScoreReason
  }
  badges: Badge[]
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

// Badge definitions
const BADGE_DEFINITIONS: Record<string, Omit<Badge, 'id'>> = {
  diamond_hands: {
    name: 'Diamond Hands',
    icon: '💎',
    description: 'Wallet active for over 1 year',
    rarity: 'epic',
  },
  og_holder: {
    name: 'OG Holder',
    icon: '👴',
    description: 'Wallet active for over 2 years',
    rarity: 'legendary',
  },
  whale: {
    name: 'Whale',
    icon: '🐋',
    description: 'Holdings exceed 100 SOL',
    rarity: 'epic',
  },
  dolphin: {
    name: 'Dolphin',
    icon: '🐬',
    description: 'Holdings exceed 10 SOL',
    rarity: 'rare',
  },
  active_trader: {
    name: 'Active Trader',
    icon: '📈',
    description: 'Over 1,000 transactions',
    rarity: 'epic',
  },
  frequent_user: {
    name: 'Frequent User',
    icon: '⚡',
    description: 'Over 100 transactions',
    rarity: 'rare',
  },
  nft_collector: {
    name: 'NFT Collector',
    icon: '🖼️',
    description: 'Owns 10+ NFTs',
    rarity: 'rare',
  },
  nft_whale: {
    name: 'NFT Whale',
    icon: '🎨',
    description: 'Owns 50+ NFTs',
    rarity: 'epic',
  },
  token_diversifier: {
    name: 'Token Diversifier',
    icon: '🌈',
    description: 'Holds 10+ different tokens',
    rarity: 'rare',
  },
  defi_degen: {
    name: 'DeFi Degen',
    icon: '🔥',
    description: 'Has staked SOL in liquid staking protocols',
    rarity: 'rare',
  },
  staking_maxi: {
    name: 'Staking Maxi',
    icon: '🔒',
    description: 'Over 50% of holdings in staked SOL',
    rarity: 'epic',
  },
  fresh_wallet: {
    name: 'Fresh Wallet',
    icon: '🌱',
    description: 'Wallet less than 30 days old',
    rarity: 'common',
  },
  perfect_score: {
    name: 'Perfect Score',
    icon: '👑',
    description: 'Achieved maximum score in any category',
    rarity: 'legendary',
  },
  s_tier: {
    name: 'S-Tier',
    icon: '⭐',
    description: 'Overall S grade (90+ score)',
    rarity: 'legendary',
  },
}

function getGrade(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

function getAgeReason(days: number, score: number): ScoreReason {
  let reason: string
  let details: string
  
  if (days >= 150) {
    reason = 'Veteran wallet'
    details = `${days} days old - maximum maturity achieved`
  } else if (days >= 120) {
    reason = 'Well-established'
    details = `${days} days old - 4+ months of history`
  } else if (days >= 90) {
    reason = 'Established wallet'
    details = `${days} days old - 3+ months on-chain`
  } else if (days >= 60) {
    reason = 'Growing history'
    details = `${days} days old - building credibility`
  } else if (days >= 30) {
    reason = 'New but active'
    details = `${days} days old - 1+ month of activity`
  } else {
    reason = 'Fresh wallet'
    details = `Only ${days} days old - needs more history`
  }
  
  return { score, maxScore: 25, reason, details }
}

function getActivityReason(txCount: number, score: number): ScoreReason {
  let reason: string
  let details: string
  
  if (txCount >= 50) {
    reason = 'Highly active'
    details = `${txCount} transactions - power user status`
  } else if (txCount >= 40) {
    reason = 'Very active'
    details = `${txCount} transactions - frequent usage`
  } else if (txCount >= 30) {
    reason = 'Active user'
    details = `${txCount} transactions - regular engagement`
  } else if (txCount >= 20) {
    reason = 'Moderate activity'
    details = `${txCount} transactions - average usage`
  } else if (txCount >= 10) {
    reason = 'Low activity'
    details = `${txCount} transactions - occasional user`
  } else {
    reason = 'Minimal activity'
    details = `Only ${txCount} transactions - limited engagement`
  }
  
  return { score, maxScore: 25, reason, details }
}

function getBalanceReason(totalSol: number, solBalance: number, stakedSol: number, score: number): ScoreReason {
  let reason: string
  let details: string
  
  const stakingNote = stakedSol > 0 ? ` (${stakedSol.toFixed(2)} staked)` : ''
  
  if (totalSol >= 100) {
    reason = 'Whale status'
    details = `${totalSol.toFixed(2)} SOL total${stakingNote} - significant holdings`
  } else if (totalSol >= 50) {
    reason = 'Major holder'
    details = `${totalSol.toFixed(2)} SOL total${stakingNote} - substantial position`
  } else if (totalSol >= 10) {
    reason = 'Solid holdings'
    details = `${totalSol.toFixed(2)} SOL total${stakingNote} - meaningful stake`
  } else if (totalSol >= 1) {
    reason = 'Modest holdings'
    details = `${totalSol.toFixed(2)} SOL total${stakingNote} - some skin in the game`
  } else if (totalSol >= 0.1) {
    reason = 'Small holdings'
    details = `${totalSol.toFixed(3)} SOL total - minimal funds`
  } else {
    reason = 'Dust account'
    details = `${totalSol.toFixed(4)} SOL total - needs funding`
  }
  
  return { score, maxScore: 25, reason, details }
}

function getDiversityReason(tokenCount: number, nftCount: number, score: number): ScoreReason {
  let reason: string
  let details: string
  
  const totalAssets = tokenCount + nftCount
  
  if (totalAssets >= 15) {
    reason = 'Highly diversified'
    details = `${tokenCount} tokens + ${nftCount} NFTs - excellent portfolio diversity`
  } else if (totalAssets >= 10) {
    reason = 'Well diversified'
    details = `${tokenCount} tokens + ${nftCount} NFTs - good asset spread`
  } else if (totalAssets >= 5) {
    reason = 'Moderately diversified'
    details = `${tokenCount} tokens + ${nftCount} NFTs - some variety`
  } else if (totalAssets >= 2) {
    reason = 'Limited diversity'
    details = `${tokenCount} tokens + ${nftCount} NFTs - concentrated holdings`
  } else {
    reason = 'Minimal diversity'
    details = `${tokenCount} tokens + ${nftCount} NFTs - needs diversification`
  }
  
  return { score, maxScore: 25, reason, details }
}

function calculateBadges(
  oldestTxDays: number,
  txCount: number,
  totalSolValue: number,
  stakedSol: number,
  nftCount: number,
  tokenCount: number,
  totalScore: number,
  ageScore: number,
  activityScore: number,
  balanceScore: number,
  diversityScore: number
): Badge[] {
  const badges: Badge[] = []
  
  // Age-based badges
  if (oldestTxDays >= 730) {
    badges.push({ id: 'og_holder', ...BADGE_DEFINITIONS.og_holder })
  } else if (oldestTxDays >= 365) {
    badges.push({ id: 'diamond_hands', ...BADGE_DEFINITIONS.diamond_hands })
  } else if (oldestTxDays < 30) {
    badges.push({ id: 'fresh_wallet', ...BADGE_DEFINITIONS.fresh_wallet })
  }
  
  // Balance-based badges
  if (totalSolValue >= 100) {
    badges.push({ id: 'whale', ...BADGE_DEFINITIONS.whale })
  } else if (totalSolValue >= 10) {
    badges.push({ id: 'dolphin', ...BADGE_DEFINITIONS.dolphin })
  }
  
  // Activity-based badges
  if (txCount >= 1000) {
    badges.push({ id: 'active_trader', ...BADGE_DEFINITIONS.active_trader })
  } else if (txCount >= 100) {
    badges.push({ id: 'frequent_user', ...BADGE_DEFINITIONS.frequent_user })
  }
  
  // NFT badges
  if (nftCount >= 50) {
    badges.push({ id: 'nft_whale', ...BADGE_DEFINITIONS.nft_whale })
  } else if (nftCount >= 10) {
    badges.push({ id: 'nft_collector', ...BADGE_DEFINITIONS.nft_collector })
  }
  
  // Token diversity badge
  if (tokenCount >= 10) {
    badges.push({ id: 'token_diversifier', ...BADGE_DEFINITIONS.token_diversifier })
  }
  
  // Staking badges
  if (stakedSol > 0) {
    badges.push({ id: 'defi_degen', ...BADGE_DEFINITIONS.defi_degen })
    if (totalSolValue > 0 && (stakedSol / totalSolValue) > 0.5) {
      badges.push({ id: 'staking_maxi', ...BADGE_DEFINITIONS.staking_maxi })
    }
  }
  
  // Perfect score badge
  if (ageScore === 25 || activityScore === 25 || balanceScore === 25 || diversityScore === 25) {
    badges.push({ id: 'perfect_score', ...BADGE_DEFINITIONS.perfect_score })
  }
  
  // S-tier badge
  if (totalScore >= 90) {
    badges.push({ id: 's_tier', ...BADGE_DEFINITIONS.s_tier })
  }
  
  // Sort by rarity (legendary first)
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
  badges.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
  
  return badges
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
  
  // Generate reasons
  const reasons = {
    age: getAgeReason(oldestTxDays, ageScore),
    activity: getActivityReason(txCount, activityScore),
    balance: getBalanceReason(totalSolValue, solBalance, stakedSol, balanceScore),
    diversity: getDiversityReason(fungibleTokenCount, nftCount, diversityScore),
  }
  
  // Calculate badges
  const badges = calculateBadges(
    oldestTxDays,
    txCount,
    totalSolValue,
    stakedSol,
    nftCount,
    fungibleTokenCount,
    totalScore,
    ageScore,
    activityScore,
    balanceScore,
    diversityScore
  )
  
  return {
    score: totalScore,
    grade: getGrade(totalScore),
    breakdown: {
      age: ageScore,
      activity: activityScore,
      balance: balanceScore,
      diversity: diversityScore,
    },
    reasons,
    badges,
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
