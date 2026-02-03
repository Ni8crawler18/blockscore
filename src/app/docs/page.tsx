import Image from 'next/image'
import Link from 'next/link'

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
            <Link href="/docs" className="text-white">Docs</Link>
            <a href="/api/score?wallet=vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg" target="_blank" className="hover:text-white transition-colors">API</a>
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
              </div>

              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-semibold">Activity (0-25 pts)</h3>
                </div>
                <p className="text-sm text-white/50">Transaction frequency from recent history. 5 points per 10 transactions.</p>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🔄</span>
                  <h3 className="font-semibold">DeFi (0-25 pts)</h3>
                </div>
                <p className="text-sm text-white/50">Interactions with DeFi protocols (Jupiter, Raydium, Kamino, Marinade). 2 points per interaction.</p>
              </div>

              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">💎</span>
                  <h3 className="font-semibold">Diversity (0-25 pts)</h3>
                </div>
                <p className="text-sm text-white/50">Variety of token holdings. 3 points per unique token type.</p>
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
                <pre className="bg-white/5 rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
{`{
  "score": 71,
  "grade": "B",
  "breakdown": {
    "age": 25,
    "activity": 25,
    "defi": 0,
    "diversity": 21
  },
  "wallet": "vines1vzr...NKPTg"
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
