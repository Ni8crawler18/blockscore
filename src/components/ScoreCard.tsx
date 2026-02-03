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

export default function ScoreCard({ data, onReset }: { data: ScoreData; onReset: () => void }) {
  const shareText = `My BlockScore: ${data.score}/100 (${data.grade}) 🎯\n\nCheck your Solana wallet reputation:\nblockscore.xyz\n\n#BlockScore #Solana`
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  const gradeColor = {
    'S': 'text-yellow-400',
    'A': 'text-green-400',
    'B': 'text-blue-400',
    'C': 'text-gray-400',
    'D': 'text-orange-400',
    'F': 'text-red-400',
  }[data.grade] || 'text-white'

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      <div>
        <p className="text-sm text-gray-400 mb-1">Wallet</p>
        <p className="font-mono text-sm">{data.wallet.slice(0,8)}...{data.wallet.slice(-8)}</p>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <div className="text-6xl font-bold">{data.score}</div>
        <div className={`text-4xl font-bold ${gradeColor}`}>{data.grade}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-gray-400">Age</p>
          <p className="font-bold">{data.breakdown.age}/25</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-gray-400">Activity</p>
          <p className="font-bold">{data.breakdown.activity}/25</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-gray-400">DeFi</p>
          <p className="font-bold">{data.breakdown.defi}/25</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-gray-400">Diversity</p>
          <p className="font-bold">{data.breakdown.diversity}/25</p>
        </div>
      </div>

      <div className="flex gap-3">
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener"
          className="flex-1 p-3 rounded-lg bg-gradient-to-r from-solana to-solana-green font-bold text-center hover:opacity-90"
        >
          Share on X
        </a>
        <button
          onClick={onReset}
          className="px-4 rounded-lg border border-white/20 hover:bg-white/10"
        >
          ↻
        </button>
      </div>
    </div>
  )
}
