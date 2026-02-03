'use client'
import { useState } from 'react'
import Image from 'next/image'
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

const SAMPLE_WALLETS = [
  { label: 'Toly (Solana)', address: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg' },
  { label: 'Jump Trading', address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
  { label: 'Metaplex', address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' },
]

export default function Home() {
  const [wallet, setWallet] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ScoreData | null>(null)
  const [error, setError] = useState('')

  const checkScore = async (address?: string) => {
    const targetWallet = address || wallet
    if (!targetWallet) return
    setWallet(targetWallet)
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch(`/api/score?wallet=${targetWallet}`)
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
      <header className="w-full px-6 py-5 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="BlockScore" width={32} height={32} />
            <span className="font-semibold text-lg">BlockScore</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="/docs" className="hover:text-white transition-colors">Docs</a>
            <a href="/api/score?wallet=vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg" target="_blank" className="hover:text-white transition-colors">API</a>
            <a href="https://github.com/Ni8crawler18/blockscore" target="_blank" rel="noopener" className="hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              GitHub
            </a>
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
                  On-chain reputation scoring for Solana wallets.
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
                  onClick={() => checkScore()}
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

              {/* Sample Wallets */}
              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-white/40 mb-3">Try a sample wallet</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SAMPLE_WALLETS.map((sample) => (
                    <button
                      key={sample.address}
                      onClick={() => checkScore(sample.address)}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 
                                 hover:bg-white/10 hover:border-white/20 transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">100+</div>
                  <div className="text-xs text-white/40 mt-1">Data Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">&lt;5s</div>
                  <div className="text-xs text-white/40 mt-1">Analysis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">Free</div>
                  <div className="text-xs text-white/40 mt-1">Forever</div>
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
          <div>© 2026 BlockScore</div>
          <div className="flex items-center gap-4">
            <a href="/docs" className="hover:text-white transition-colors">Docs</a>
            <a href="https://github.com/Ni8crawler18/blockscore" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://twitter.com/eigen_12" target="_blank" rel="noopener" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
