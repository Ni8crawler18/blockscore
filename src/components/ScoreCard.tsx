'use client'
import { useState } from 'react'

interface ScoreReason {
  score: number
  maxScore: number
  reason: string
  details: string
}

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface ScoreData {
  score: number
  grade: string
  breakdown: {
    age: number
    activity: number
    balance: number
    diversity: number
  }
  reasons?: {
    age: ScoreReason
    activity: ScoreReason
    balance: ScoreReason
    diversity: ScoreReason
  }
  badges?: Badge[]
  wallet: string
  stats?: {
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

const metrics = [
  { key: 'age', label: 'Age', description: 'Wallet maturity', icon: '⏱' },
  { key: 'activity', label: 'Activity', description: 'Transaction frequency', icon: '⚡' },
  { key: 'balance', label: 'Balance', description: 'SOL holdings', icon: '💰' },
  { key: 'diversity', label: 'Diversity', description: 'Token holdings', icon: '💎' },
] as const

const rarityColors = {
  common: 'from-gray-400 to-gray-500 border-gray-400/30',
  rare: 'from-blue-400 to-blue-500 border-blue-400/30',
  epic: 'from-purple-400 to-purple-500 border-purple-400/30',
  legendary: 'from-amber-400 to-orange-500 border-amber-400/30',
}

const rarityBg = {
  common: 'bg-gray-400/10',
  rare: 'bg-blue-400/10',
  epic: 'bg-purple-400/10',
  legendary: 'bg-amber-400/10',
}

export default function ScoreCard({ data, onReset }: { data: ScoreData; onReset: () => void }) {
  const [copied, setCopied] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  
  const shareText = `My BlockScore: ${data.score}/100 (Grade ${data.grade}) 🎯${data.badges && data.badges.length > 0 ? `\n\nBadges: ${data.badges.slice(0, 3).map(b => `${b.icon} ${b.name}`).join(', ')}` : ''}\n\nCheck your Solana wallet reputation:\nblockscore.vercel.app\n\n#BlockScore #Solana`
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-primary-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  const getBarGradient = (value: number, max: number) => {
    const percent = (value / max) * 100
    if (percent >= 80) return 'from-emerald-500 to-emerald-400'
    if (percent >= 60) return 'from-primary-500 to-primary-400'
    if (percent >= 40) return 'from-amber-500 to-amber-400'
    return 'from-red-500 to-red-400'
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`BlockScore: ${data.score}/100 (${data.grade}) - ${data.wallet}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const solscanUrl = `https://solscan.io/account/${data.wallet}`
  const ogImageUrl = `https://blockscore.vercel.app/api/og?score=${data.score}&grade=${data.grade}&wallet=${data.wallet}&age=${data.breakdown.age}&activity=${data.breakdown.activity}&balance=${data.breakdown.balance}&diversity=${data.breakdown.diversity}${data.badges ? `&badges=${encodeURIComponent(data.badges.slice(0, 4).map(b => b.icon).join(''))}` : ''}`

  return (
    <div className="animate-slide-up">
      {/* Main Score Card */}
      <div className="glass rounded-3xl p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Wallet Address</p>
            <a 
              href={solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-white/70 hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              {data.wallet.slice(0, 6)}...{data.wallet.slice(-6)}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <button
            onClick={onReset}
            className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
            title="Analyze another wallet"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="text-center">
            <div className={`text-7xl font-bold tracking-tight ${getScoreColor(data.score)}`}>
              {data.score}
            </div>
            <div className="text-white/40 text-sm mt-1">out of 100</div>
          </div>
          <div className={`grade-badge grade-${data.grade}`}>
            {data.grade}
          </div>
        </div>

        {/* Score Bar */}
        <div className="space-y-2">
          <div className="score-bar">
            <div 
              className={`score-bar-fill bg-gradient-to-r ${getBarGradient(data.score, 100)}`}
              style={{ '--score-width': `${data.score}%` } as React.CSSProperties}
            />
          </div>
          <div className="flex justify-between text-xs text-white/30">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Badges Section */}
        {data.badges && data.badges.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/40 uppercase tracking-wider">Badges Earned</p>
              <p className="text-xs text-white/30">{data.badges.length} badge{data.badges.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`group relative px-3 py-2 rounded-xl border ${rarityBg[badge.rarity]} ${rarityColors[badge.rarity].split(' ')[2]} cursor-help transition-all hover:scale-105`}
                  title={badge.description}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{badge.icon}</span>
                    <span className={`text-xs font-medium bg-gradient-to-r ${rarityColors[badge.rarity].split(' ').slice(0, 2).join(' ')} bg-clip-text text-transparent`}>
                      {badge.name}
                    </span>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 rounded-lg text-xs text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {badge.description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown with Toggle */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40 uppercase tracking-wider">Score Breakdown</p>
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
            >
              {showExplanation ? 'Hide' : 'Show'} explanations
              <svg className={`w-3 h-3 transition-transform ${showExplanation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => {
              const value = data.breakdown[metric.key]
              const percent = (value / 25) * 100
              const reason = data.reasons?.[metric.key]
              return (
                <div key={metric.key} className="stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{metric.icon}</span>
                    <span className={`text-xl font-bold ${getScoreColor(percent)}`}>
                      {value}
                      <span className="text-white/30 text-sm font-normal">/25</span>
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white/90">{metric.label}</div>
                    {showExplanation && reason ? (
                      <div className="mt-1">
                        <div className="text-xs text-primary-400 font-medium">{reason.reason}</div>
                        <div className="text-xs text-white/40 mt-0.5">{reason.details}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-white/40">{metric.description}</div>
                    )}
                  </div>
                  <div className="mt-3 score-bar">
                    <div 
                      className={`score-bar-fill bg-gradient-to-r ${getBarGradient(value, 25)}`}
                      style={{ '--score-width': `${percent}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        {data.stats && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{data.stats.totalSolValue}</div>
                <div className="text-[10px] text-white/40">Total SOL</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{data.stats.stakedSol > 0 ? data.stats.stakedSol : '-'}</div>
                <div className="text-[10px] text-white/40">Staked</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{data.stats.tokenCount}</div>
                <div className="text-[10px] text-white/40">Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{data.stats.nftCount}</div>
                <div className="text-[10px] text-white/40">NFTs</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{data.stats.txCount}</div>
                <div className="text-[10px] text-white/40">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{data.stats.oldestTxDays}d</div>
                <div className="text-[10px] text-white/40">Age</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">{data.stats.lastActiveDays === 0 ? 'Today' : `${data.stats.lastActiveDays}d ago`}</div>
                <div className="text-[10px] text-white/40">Last Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>
          <a
            href={solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-4 flex items-center justify-center"
            title="View on Solscan"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={copyToClipboard}
            className="btn-secondary px-4 flex items-center justify-center"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Share Card Preview Link */}
        <div className="text-center pt-2">
          <a 
            href={ogImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-primary-400 transition-colors"
          >
            📷 View shareable score card image
          </a>
        </div>
      </div>

      {/* Trust indicator */}
      <div className="mt-4 text-center text-xs text-white/30">
        Data from Solana mainnet • Real-time analysis
      </div>
    </div>
  )
}
