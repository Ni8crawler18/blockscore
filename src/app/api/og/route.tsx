import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const score = searchParams.get('score') || '?'
  const grade = searchParams.get('grade') || '?'
  const wallet = searchParams.get('wallet') || 'Unknown'
  const age = searchParams.get('age') || '0'
  const activity = searchParams.get('activity') || '0'
  const balance = searchParams.get('balance') || '0'
  const diversity = searchParams.get('diversity') || '0'
  const badges = searchParams.get('badges') || ''

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

  const getScoreBarColor = (value: number) => {
    const percent = (value / 25) * 100
    if (percent >= 80) return '#34d399'
    if (percent >= 60) return '#a855f7'
    if (percent >= 40) return '#fbbf24'
    return '#f87171'
  }

  const breakdown = [
    { label: 'Age', value: parseInt(age), icon: '⏱' },
    { label: 'Activity', value: parseInt(activity), icon: '⚡' },
    { label: 'Balance', value: parseInt(balance), icon: '💰' },
    { label: 'Diversity', value: parseInt(diversity), icon: '💎' },
  ]

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px',
          backgroundColor: '#0a0a0f',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2f 50%, #0f0f1a 100%)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              B
            </div>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>BlockScore</span>
          </div>
          {/* Wallet address */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: '#ffffff10',
              borderRadius: '12px',
              fontSize: '16px',
              color: '#ffffff80',
              fontFamily: 'monospace',
            }}
          >
            {wallet.length > 20 ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}` : wallet}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, gap: '48px' }}>
          {/* Left side - Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: '0 0 320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span
                style={{
                  fontSize: '140px',
                  fontWeight: 'bold',
                  color: getGradeColor(grade),
                  lineHeight: 1,
                }}
              >
                {score}
              </span>
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: 'bold',
                  color: getGradeColor(grade),
                  backgroundColor: `${getGradeColor(grade)}20`,
                  border: `3px solid ${getGradeColor(grade)}40`,
                  borderRadius: '16px',
                  padding: '12px 24px',
                }}
              >
                {grade}
              </div>
            </div>
            <span style={{ fontSize: '20px', color: '#ffffff50', marginTop: '12px' }}>out of 100</span>
            
            {/* Badges */}
            {badges && (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '24px',
                padding: '12px 20px',
                backgroundColor: '#ffffff08',
                borderRadius: '12px',
              }}>
                {badges.split('').map((emoji, i) => (
                  <span key={i} style={{ fontSize: '32px' }}>{emoji}</span>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '16px' }}>
            <div style={{ fontSize: '14px', color: '#ffffff40', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              Score Breakdown
            </div>
            {breakdown.map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '24px', width: '36px' }}>{item.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '18px', color: '#ffffffcc' }}>{item.label}</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: getScoreBarColor(item.value) }}>
                      {item.value}/25
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '10px', 
                    backgroundColor: '#ffffff10',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(item.value / 25) * 100}%`,
                      height: '100%',
                      backgroundColor: getScoreBarColor(item.value),
                      borderRadius: '5px',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #ffffff10',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#ffffff40' }}>
            <span>blockscore.vercel.app</span>
            <span>•</span>
            <span>Solana Wallet Reputation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#ffffff30' }}>
            <span>Powered by</span>
            <span style={{ 
              background: 'linear-gradient(90deg, #9945FF, #14F195)', 
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold',
            }}>
              Solana
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
