import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const score = searchParams.get('score') || '?'
  const grade = searchParams.get('grade') || '?'
  const wallet = searchParams.get('wallet') || 'Unknown'

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'S': return '#fbbf24'
      case 'A': return '#34d399'
      case 'B': return '#a855f7'
      case 'C': return '#94a3b8'
      case 'D': return '#fb923c'
      default: return '#f87171'
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2f 50%, #0f0f1a 100%)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            B
          </div>
          <span style={{ fontSize: '40px', fontWeight: 'bold', color: 'white' }}>BlockScore</span>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span
            style={{
              fontSize: '180px',
              fontWeight: 'bold',
              color: getGradeColor(grade),
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: getGradeColor(grade),
              backgroundColor: `${getGradeColor(grade)}20`,
              border: `4px solid ${getGradeColor(grade)}40`,
              borderRadius: '20px',
              padding: '16px 32px',
            }}
          >
            {grade}
          </div>
        </div>

        <span style={{ fontSize: '24px', color: '#ffffff60', marginTop: '20px' }}>out of 100</span>

        {/* Wallet */}
        <div
          style={{
            marginTop: '40px',
            padding: '16px 32px',
            backgroundColor: '#ffffff10',
            borderRadius: '12px',
            fontSize: '20px',
            color: '#ffffff80',
            fontFamily: 'monospace',
          }}
        >
          {wallet.length > 20 ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}` : wallet}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '20px',
            color: '#ffffff40',
          }}
        >
          <span>blockscore.vercel.app</span>
          <span>•</span>
          <span>Solana Wallet Reputation</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
