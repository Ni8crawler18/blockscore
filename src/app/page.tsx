'use client'
import { useState } from 'react'
import ScoreCard from '@/components/ScoreCard'

interface ScoreData {
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

export default function Home() {
  const [wallet, setWallet] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ScoreData | null>(null)
  const [error, setError] = useState('')

  const checkScore = async () => {
    if (!wallet) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch(`/api/score?wallet=${wallet}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e: any) {
      setError(e.message || 'Failed to fetch score')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && wallet && !loading) {
      checkScore()
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-lg">BlockScore</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="https://github.com" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg animate-fade-in">
          {!data ? (
            <div className="text-center space-y-8">
              {/* Hero */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></span>
                  Powered by Solana
                </div>
                <h1 className="heading-xl">
                  <span className="text-white">Wallet</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent bg-clip-text text-transparent">
                    Reputation
                  </span>
                </h1>
                <p className="text-white/50 text-lg max-w-md mx-auto leading-relaxed">
                  Institutional-grade on-chain reputation scoring. 
                  Analyze any Solana wallet in seconds.
                </p>
              </div>

              {/* Input */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter Solana wallet address"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-field font-mono text-sm pr-12"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={checkScore}
                  disabled={loading || !wallet}
                  className="btn-primary w-full py-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Wallet'
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
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 pt-8 border-t border-white/5">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">100+</div>
                  <div className="text-xs text-white/40 mt-1">Data Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">&lt;5s</div>
                  <div className="text-xs text-white/40 mt-1">Analysis Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">Free</div>
                  <div className="text-xs text-white/40 mt-1">Always</div>
                </div>
              </div>
            </div>
          ) : (
            <ScoreCard data={data} onReset={() => setData(null)} />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <div>© 2026 BlockScore. Built for the Solana ecosystem.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="https://twitter.com" target="_blank" rel="noopener" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
