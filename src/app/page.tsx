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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-solana to-solana-green bg-clip-text text-transparent">
          BlockScore
        </h1>
        <p className="text-gray-400 mb-8">On-chain wallet reputation powered by ML</p>
        
        {!data ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter Solana wallet address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-solana outline-none"
            />
            <button
              onClick={checkScore}
              disabled={loading || !wallet}
              className="w-full p-4 rounded-lg bg-gradient-to-r from-solana to-solana-green font-bold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Check Score'}
            </button>
            {error && <p className="text-red-400">{error}</p>}
          </div>
        ) : (
          <ScoreCard data={data} onReset={() => setData(null)} />
        )}
      </div>
    </main>
  )
}
