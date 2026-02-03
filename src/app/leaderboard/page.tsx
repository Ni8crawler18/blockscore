'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface WalletScore {
  label: string
  address: string
  score?: number
  grade?: string
  loading?: boolean
  error?: string
}

const FAMOUS_WALLETS: WalletScore[] = [
  { label: 'Anatoly Yakovenko (Toly)', address: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg' },
  { label: 'Jump Trading', address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
  { label: 'Metaplex', address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' },
  { label: 'Raydium', address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' },
  { label: 'Jupiter', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
  { label: 'Magic Eden', address: 'GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp' },
  { label: 'Tensor', address: 'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN' },
  { label: 'Marinade Finance', address: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD' },
  { label: 'Jito', address: 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb' },
  { label: 'Phantom', address: 'AB1eu2L1Jr3nfEft85AuD2zGksUbam1Kr8MR5awzjvKT' },
]

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'S': return 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    case 'A': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
    case 'B': return 'text-primary-400 bg-primary-400/10 border-primary-400/30'
    case 'C': return 'text-slate-400 bg-slate-400/10 border-slate-400/30'
    case 'D': return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
    default: return 'text-red-400 bg-red-400/10 border-red-400/30'
  }
}

export default function LeaderboardPage() {
  const [wallets, setWallets] = useState<WalletScore[]>(
    FAMOUS_WALLETS.map(w => ({ ...w, loading: true }))
  )
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score')

  useEffect(() => {
    const fetchScores = async () => {
      const results = await Promise.all(
        FAMOUS_WALLETS.map(async (wallet) => {
          try {
            const res = await fetch(`/api/score?wallet=${wallet.address}`)
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            return { ...wallet, score: data.score, grade: data.grade, loading: false }
          } catch (e: any) {
            return { ...wallet, error: e.message, loading: false }
          }
        })
      )
      setWallets(results)
    }
    fetchScores()
  }, [])

  const sortedWallets = [...wallets].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.score || 0) - (a.score || 0)
    }
    return a.label.localeCompare(b.label)
  })

  const loadingCount = wallets.filter(w => w.loading).length

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
            <Link href="/leaderboard" className="text-white">Leaderboard</Link>
            <Link href="/compare" className="hover:text-white transition-colors">Compare</Link>
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
            <h1 className="heading-lg">🏆 Leaderboard</h1>
            <p className="text-white/50">Reputation scores of famous Solana wallets</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/40">
              {loadingCount > 0 ? `Loading ${loadingCount} wallets...` : `${wallets.length} wallets`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('score')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  sortBy === 'score' 
                    ? 'bg-primary-500/20 border-primary-500/30 text-primary-400' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                By Score
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  sortBy === 'name' 
                    ? 'bg-primary-500/20 border-primary-500/30 text-primary-400' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                By Name
              </button>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-3">
            {sortedWallets.map((wallet, idx) => (
              <Link
                key={wallet.address}
                href={`/?wallet=${wallet.address}`}
                className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all group"
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {sortBy === 'score' && !wallet.loading && wallet.score !== undefined ? (
                    <span className={`text-lg font-bold ${idx < 3 ? 'text-amber-400' : 'text-white/40'}`}>
                      #{idx + 1}
                    </span>
                  ) : (
                    <span className="text-white/20">-</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white group-hover:text-primary-400 transition-colors truncate">
                    {wallet.label}
                  </div>
                  <div className="text-xs font-mono text-white/40 truncate">
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3">
                  {wallet.loading ? (
                    <div className="flex items-center gap-2 text-white/40">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : wallet.error ? (
                    <span className="text-xs text-red-400">Error</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-white">{wallet.score}</span>
                      <span className={`px-2 py-1 text-sm font-bold rounded border ${getGradeColor(wallet.grade!)}`}>
                        {wallet.grade}
                      </span>
                    </>
                  )}
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center pt-8 border-t border-white/5">
            <p className="text-white/40 mb-4">Want to see your wallet on the leaderboard?</p>
            <Link href="/" className="btn-primary inline-flex items-center gap-2">
              Check Your Score
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
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
