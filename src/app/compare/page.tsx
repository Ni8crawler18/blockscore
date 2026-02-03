'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ScoreData {
  score: number
  grade: string
  breakdown: {
    age: number
    activity: number
    balance: number
    diversity: number
  }
  wallet: string
  stats?: {
    solBalance: number
    tokenCount: number
    txCount: number
    oldestTxDays: number
  }
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'S': return 'text-amber-400'
    case 'A': return 'text-emerald-400'
    case 'B': return 'text-primary-400'
    case 'C': return 'text-slate-400'
    case 'D': return 'text-orange-400'
    default: return 'text-red-400'
  }
}

const getBarColor = (value: number, max: number) => {
  const percent = (value / max) * 100
  if (percent >= 80) return 'bg-emerald-500'
  if (percent >= 60) return 'bg-primary-500'
  if (percent >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function ComparePage() {
  const [wallet1, setWallet1] = useState('')
  const [wallet2, setWallet2] = useState('')
  const [data1, setData1] = useState<ScoreData | null>(null)
  const [data2, setData2] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const compare = async () => {
    if (!wallet1 || !wallet2) return
    setLoading(true)
    setError('')
    setData1(null)
    setData2(null)

    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/score?wallet=${wallet1}`),
        fetch(`/api/score?wallet=${wallet2}`)
      ])
      const [json1, json2] = await Promise.all([res1.json(), res2.json()])
      
      if (json1.error) throw new Error(`Wallet 1: ${json1.error}`)
      if (json2.error) throw new Error(`Wallet 2: ${json2.error}`)
      
      setData1(json1)
      setData2(json2)
    } catch (e: any) {
      setError(e.message || 'Failed to compare wallets')
    } finally {
      setLoading(false)
    }
  }

  const metrics = [
    { key: 'age', label: 'Age', icon: '⏱' },
    { key: 'activity', label: 'Activity', icon: '⚡' },
    { key: 'balance', label: 'Balance', icon: '💰' },
    { key: 'diversity', label: 'Diversity', icon: '💎' },
  ] as const

  const winner = data1 && data2 
    ? data1.score > data2.score ? 1 : data1.score < data2.score ? 2 : 0 
    : null

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-5 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="BlockScore" width={32} height={32} />
            <span className="font-semibold text-lg">BlockScore</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/compare" className="text-white">Compare</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <a href="https://github.com/Ni8crawler18/blockscore" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="heading-lg">⚔️ Compare Wallets</h1>
            <p className="text-white/50">Head-to-head reputation battle</p>
          </div>

          {/* Inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-wider">Wallet 1</label>
              <input
                type="text"
                placeholder="Enter wallet address"
                value={wallet1}
                onChange={(e) => setWallet1(e.target.value)}
                className="input-field font-mono text-sm"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-wider">Wallet 2</label>
              <input
                type="text"
                placeholder="Enter wallet address"
                value={wallet2}
                onChange={(e) => setWallet2(e.target.value)}
                className="input-field font-mono text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={compare}
            disabled={loading || !wallet1 || !wallet2}
            className="btn-primary w-full py-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Comparing...
              </span>
            ) : (
              '⚔️ Compare'
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Results */}
          {data1 && data2 && (
            <div className="space-y-6 animate-slide-up">
              {/* Score comparison */}
              <div className="glass rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Wallet 1 */}
                  <div className={`text-center ${winner === 1 ? 'scale-105' : ''} transition-transform`}>
                    {winner === 1 && <div className="text-amber-400 text-sm mb-2">👑 Winner</div>}
                    <div className={`text-5xl font-bold ${getGradeColor(data1.grade)}`}>{data1.score}</div>
                    <div className="text-2xl font-bold mt-2">{data1.grade}</div>
                    <div className="text-xs font-mono text-white/40 mt-2 truncate px-2">
                      {data1.wallet.slice(0, 6)}...{data1.wallet.slice(-4)}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white/20">VS</div>
                    {winner === 0 && <div className="text-amber-400 text-sm mt-2">🤝 Tie!</div>}
                  </div>

                  {/* Wallet 2 */}
                  <div className={`text-center ${winner === 2 ? 'scale-105' : ''} transition-transform`}>
                    {winner === 2 && <div className="text-amber-400 text-sm mb-2">👑 Winner</div>}
                    <div className={`text-5xl font-bold ${getGradeColor(data2.grade)}`}>{data2.score}</div>
                    <div className="text-2xl font-bold mt-2">{data2.grade}</div>
                    <div className="text-xs font-mono text-white/40 mt-2 truncate px-2">
                      {data2.wallet.slice(0, 6)}...{data2.wallet.slice(-4)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric breakdown */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-medium text-white/60 text-center">Breakdown</h3>
                
                {metrics.map((metric) => {
                  const val1 = data1.breakdown[metric.key]
                  const val2 = data2.breakdown[metric.key]
                  const metricWinner = val1 > val2 ? 1 : val1 < val2 ? 2 : 0

                  return (
                    <div key={metric.key} className="space-y-2">
                      <div className="flex justify-between text-xs text-white/40">
                        <span>{metric.icon} {metric.label}</span>
                        <span>/ 25</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Bar 1 */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getBarColor(val1, 25)} transition-all duration-500`}
                              style={{ width: `${(val1 / 25) * 100}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold w-6 ${metricWinner === 1 ? 'text-emerald-400' : 'text-white'}`}>
                            {val1}
                          </span>
                        </div>
                        {/* Bar 2 */}
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold w-6 text-right ${metricWinner === 2 ? 'text-emerald-400' : 'text-white'}`}>
                            {val2}
                          </span>
                          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getBarColor(val2, 25)} transition-all duration-500 ml-auto`}
                              style={{ width: `${(val2 / 25) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stats comparison */}
              {data1.stats && data2.stats && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-sm font-medium text-white/60 text-center mb-4">Stats</h3>
                  <div className="grid grid-cols-4 gap-4 text-center text-sm">
                    <div>
                      <div className="text-white/40 text-xs mb-1">SOL Balance</div>
                      <div className="font-mono">{data1.stats.solBalance} vs {data2.stats.solBalance}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-1">Tokens</div>
                      <div className="font-mono">{data1.stats.tokenCount} vs {data2.stats.tokenCount}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-1">Transactions</div>
                      <div className="font-mono">{data1.stats.txCount} vs {data2.stats.txCount}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-1">Age (days)</div>
                      <div className="font-mono">{data1.stats.oldestTxDays} vs {data2.stats.oldestTxDays}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="text-center">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `⚔️ Wallet Battle!\n\n${data1.wallet.slice(0,6)}... (${data1.score}pts) vs ${data2.wallet.slice(0,6)}... (${data2.score}pts)\n\n${winner === 1 ? 'Wallet 1 wins!' : winner === 2 ? 'Wallet 2 wins!' : "It's a tie!"}\n\nCompare your wallets: blockscore.vercel.app/compare\n\n#BlockScore #Solana`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share Battle on X
                </a>
              </div>
            </div>
          )}

          {/* Sample comparisons */}
          {!data1 && !data2 && (
            <div className="pt-8 border-t border-white/5">
              <p className="text-xs text-white/40 text-center mb-4">Try a sample comparison</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    setWallet1('vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg')
                    setWallet2('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Toly vs Jump
                </button>
                <button
                  onClick={() => {
                    setWallet1('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
                    setWallet2('TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN')
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Metaplex vs Tensor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center text-sm text-white/40">
          © 2026 BlockScore
        </div>
      </footer>
    </main>
  )
}
