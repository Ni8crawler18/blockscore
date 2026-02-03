import Image from 'next/image'
import Link from 'next/link'

const badges = [
  { icon: '👑', name: 'S-Tier', desc: 'Overall S grade (90+ score)', rarity: 'Legendary' },
  { icon: '⭐', name: 'Perfect Score', desc: 'Maximum score in any category', rarity: 'Legendary' },
  { icon: '👴', name: 'OG Holder', desc: 'Wallet active 2+ years', rarity: 'Legendary' },
  { icon: '💎', name: 'Diamond Hands', desc: 'Wallet active 1+ year', rarity: 'Epic' },
  { icon: '🐋', name: 'Whale', desc: '100+ SOL holdings', rarity: 'Epic' },
  { icon: '📈', name: 'Active Trader', desc: '1,000+ transactions', rarity: 'Epic' },
  { icon: '🎨', name: 'NFT Whale', desc: '50+ NFTs owned', rarity: 'Epic' },
  { icon: '🔒', name: 'Staking Maxi', desc: '>50% holdings staked', rarity: 'Epic' },
  { icon: '🐬', name: 'Dolphin', desc: '10+ SOL holdings', rarity: 'Rare' },
  { icon: '⚡', name: 'Frequent User', desc: '100+ transactions', rarity: 'Rare' },
  { icon: '🖼️', name: 'NFT Collector', desc: '10+ NFTs owned', rarity: 'Rare' },
  { icon: '🌈', name: 'Token Diversifier', desc: '10+ different tokens', rarity: 'Rare' },
  { icon: '🔥', name: 'DeFi Degen', desc: 'Has liquid staked SOL', rarity: 'Rare' },
  { icon: '🌱', name: 'Fresh Wallet', desc: 'Less than 30 days old', rarity: 'Common' },
]

const rarityColors: Record<string, string> = {
  Legendary: 'text-amber-400',
  Epic: 'text-purple-400',
  Rare: 'text-blue-400',
  Common: 'text-gray-400',
}

export default function DocsPage() {
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
            <Link href="/leaderboard" className="hover:text-white transition-colors">🏆 Leaderboard</Link>
            <Link href="/compare" className="hover:text-white transition-colors">⚔️ Compare</Link>
            <Link href="/docs" className="text-white">Docs</Link>
            <a href="https://github.com/Ni8crawler18/blockscore" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          <div>
            <h1 className="heading-lg mb-4">Documentation</h1>
            <p className="text-white/60 text-lg">Learn how BlockScore calculates wallet reputation.</p>
          </div>

          {/* Scoring */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Scoring Methodology</h2>
            <p className="text-white/60">Each wallet receives a score from 0-100 based on four metrics:</p>
            
            <div className="grid gap-4 mt-6">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">⏱</span>
                  <h3 className="font-semibold">Age (0-25 pts)</h3>
                </div>
                <p className="text-sm text-white/50">Wallet maturity based on first transaction. 5 points per month, up to 25.</p>
                <div className="mt-3 text-xs text-white/30 space-y-1">
                  <p>• 0-30 days: Fresh wallet (0-5 pts)</p>
                  <p>• 30-90 days: Growing history (5-15 pts)</p>
                  <p>• 90-150 days: Established (15-25 pts)</p>
                  <p>• 150+ days: Veteran (25 pts max)</p>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-semibold">Activity (0-25 pts)</h3>
                </div>
                <p className="text-sm text-white/50">Transaction frequency from recent history. 5 points per 10 transactions.</p>
                <div className="mt-3 text-xs text-white/30 space-y-1">
                  <p>• 1-10 txns: Minimal activity (0-5 pts)</p>
                  <p>• 10-30 txns: Occasional user (5-15 pts)</p>
                  <p>• 30-50 txns: Active user (15-25 pts)</p>
                  <p>• 50+ txns: Power user (25 pts max)</p>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">💰</span>
                  <h3 className="font-semibold">Balance (0-25 pts)</h3>
                </div>
                <p className="text-sm text-white/50">Total SOL value including liquid staking tokens (mSOL, jitoSOL, bSOL, etc).</p>
                <div className="mt-3 text-xs text-white/30 space-y-1">
                  <p>• 0.1+ SOL: 5 pts</p>
                  <p>• 1+ SOL: 10 pts</p>
                  <p>• 10+ SOL: 15 pts</p>
                  <p>• 50+ SOL: 20 pts</p>
                  <p>• 100+ SOL: 25 pts max</p>
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">💎</span>
                  <h3 className="font-semibold">Diversity (0-25 pts)</h3>
                </div>
                <p className="text-sm text-white/50">Variety of token holdings. 3 points per unique token + NFT bonus.</p>
                <div className="mt-3 text-xs text-white/30 space-y-1">
                  <p>• 3 pts per fungible token held</p>
                  <p>• Up to 5 bonus pts for NFTs (1pt per 5 NFTs)</p>
                  <p>• Maximum 25 pts</p>
                </div>
              </div>
            </div>
          </section>

          {/* Grades */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Grade Scale</h2>
            <div className="glass rounded-xl p-5">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                <div><span className="text-2xl font-bold text-amber-400">S</span><p className="text-xs text-white/40 mt-1">90-100</p></div>
                <div><span className="text-2xl font-bold text-emerald-400">A</span><p className="text-xs text-white/40 mt-1">80-89</p></div>
                <div><span className="text-2xl font-bold text-primary-400">B</span><p className="text-xs text-white/40 mt-1">65-79</p></div>
                <div><span className="text-2xl font-bold text-slate-400">C</span><p className="text-xs text-white/40 mt-1">50-64</p></div>
                <div><span className="text-2xl font-bold text-orange-400">D</span><p className="text-xs text-white/40 mt-1">35-49</p></div>
                <div><span className="text-2xl font-bold text-red-400">F</span><p className="text-xs text-white/40 mt-1">0-34</p></div>
              </div>
            </div>
          </section>

          {/* Badges */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Badges & Achievements</h2>
            <p className="text-white/60">Earn badges based on your on-chain activity and holdings:</p>
            
            <div className="glass rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {badges.map((badge) => (
                  <div key={badge.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-2xl">{badge.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{badge.name}</span>
                        <span className={`text-xs ${rarityColors[badge.rarity]}`}>{badge.rarity}</span>
                      </div>
                      <p className="text-xs text-white/40">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Score Explanations */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Score Explanations</h2>
            <div className="glass rounded-xl p-5 space-y-4">
              <p className="text-white/60">Each score breakdown now includes:</p>
              <ul className="text-sm text-white/50 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  <span><strong className="text-white/80">Reason:</strong> A short summary of why you received this score (e.g., "Veteran wallet", "Whale status")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">•</span>
                  <span><strong className="text-white/80">Details:</strong> Specific metrics that contributed to the score (e.g., "150 days old - maximum maturity achieved")</span>
                </li>
              </ul>
              <p className="text-sm text-white/40">Click "Show explanations" on your score card to see detailed breakdowns.</p>
            </div>
          </section>

          {/* API */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">API Reference</h2>
            <div className="glass rounded-xl p-5 space-y-4">
              <div>
                <p className="text-sm text-white/40 mb-2">Endpoint</p>
                <code className="block bg-white/5 rounded-lg px-4 py-3 font-mono text-sm">
                  GET /api/score?wallet=&#123;address&#125;
                </code>
              </div>
              
              <div>
                <p className="text-sm text-white/40 mb-2">Example Response</p>
                <pre className="bg-white/5 rounded-lg px-4 py-3 font-mono text-xs overflow-x-auto">
{`{
  "score": 75,
  "grade": "B",
  "breakdown": {
    "age": 25,
    "activity": 25,
    "balance": 10,
    "diversity": 15
  },
  "reasons": {
    "age": {
      "score": 25,
      "maxScore": 25,
      "reason": "Veteran wallet",
      "details": "150 days old - maximum maturity achieved"
    },
    ...
  },
  "badges": [
    {
      "id": "diamond_hands",
      "name": "Diamond Hands",
      "icon": "💎",
      "description": "Wallet active for over 1 year",
      "rarity": "epic"
    },
    ...
  ],
  "wallet": "vines1vzr...NKPTg",
  "stats": {
    "solBalance": 2.5,
    "stakedSol": 5.0,
    "totalSolValue": 7.5,
    "tokenCount": 5,
    "nftCount": 10,
    "txCount": 100,
    "oldestTxDays": 365,
    "lastActiveDays": 0
  }
}`}
                </pre>
              </div>

              <div>
                <p className="text-sm text-white/40 mb-2">Try it</p>
                <a 
                  href="/api/score?wallet=vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"
                  target="_blank"
                  className="text-primary-400 hover:text-primary-300 text-sm font-mono"
                >
                  /api/score?wallet=vines1vzr...NKPTg →
                </a>
              </div>
            </div>
          </section>

          {/* Batch API */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Batch API</h2>
            <div className="glass rounded-xl p-5 space-y-4">
              <div>
                <p className="text-sm text-white/40 mb-2">Endpoint</p>
                <code className="block bg-white/5 rounded-lg px-4 py-3 font-mono text-sm">
                  POST /api/batch
                </code>
              </div>
              
              <div>
                <p className="text-sm text-white/40 mb-2">Request Body</p>
                <pre className="bg-white/5 rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
{`{
  "wallets": [
    "address1",
    "address2",
    "..."
  ]
}`}
                </pre>
              </div>

              <div>
                <p className="text-sm text-white/40 mb-2">Limits</p>
                <ul className="text-sm text-white/60 list-disc list-inside">
                  <li>Max 10 wallets per request</li>
                  <li>30 second timeout</li>
                </ul>
              </div>
            </div>
          </section>

          {/* OG Image */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">OG Image API</h2>
            <div className="glass rounded-xl p-5 space-y-4">
              <div>
                <p className="text-sm text-white/40 mb-2">Generate shareable images with full breakdown</p>
                <code className="block bg-white/5 rounded-lg px-4 py-3 font-mono text-xs break-all">
                  GET /api/og?score=75&grade=B&wallet=...&age=25&activity=20&balance=15&diversity=15&badges=💎🐬
                </code>
              </div>
              <div>
                <p className="text-sm text-white/40 mb-2">Parameters</p>
                <ul className="text-sm text-white/60 list-disc list-inside space-y-1">
                  <li>score - Total score (0-100)</li>
                  <li>grade - Letter grade (S/A/B/C/D/F)</li>
                  <li>wallet - Wallet address</li>
                  <li>age, activity, balance, diversity - Breakdown scores (0-25 each)</li>
                  <li>badges - Emoji string of earned badges</li>
                </ul>
              </div>
              <div>
                <p className="text-sm text-white/40 mb-2">Try it</p>
                <a 
                  href="/api/og?score=75&grade=B&wallet=vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg&age=25&activity=20&balance=15&diversity=15&badges=💎🐬⚡"
                  target="_blank"
                  className="text-primary-400 hover:text-primary-300 text-sm font-mono"
                >
                  View sample OG image →
                </a>
              </div>
            </div>
          </section>

          {/* Future: Historical Tracking */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">🔮 Coming Soon: Historical Tracking</h2>
            <div className="glass rounded-xl p-5 space-y-4">
              <p className="text-white/60">We&apos;re working on historical score tracking to show how your reputation changes over time:</p>
              <ul className="text-sm text-white/50 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">📊</span>
                  <span>Score history charts - see your progress over days/weeks/months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">📈</span>
                  <span>Trend indicators - are you improving or declining?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">🏅</span>
                  <span>Badge timeline - when you earned each achievement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">📧</span>
                  <span>Weekly score reports (opt-in)</span>
                </li>
              </ul>
              <p className="text-xs text-white/30 mt-4">Interested? Star the repo to stay updated!</p>
            </div>
          </section>

          {/* Back */}
          <div className="pt-6 border-t border-white/5">
            <Link href="/" className="btn-secondary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
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
