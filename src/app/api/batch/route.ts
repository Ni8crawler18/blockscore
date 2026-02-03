import { NextRequest, NextResponse } from 'next/server'
import { calculateScore } from '@/lib/score'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wallets } = body

    if (!wallets || !Array.isArray(wallets)) {
      return NextResponse.json({ error: 'wallets array required' }, { status: 400 })
    }

    if (wallets.length > 10) {
      return NextResponse.json({ error: 'Max 10 wallets per request' }, { status: 400 })
    }

    const results = await Promise.all(
      wallets.map(async (wallet: string) => {
        try {
          return await calculateScore(wallet)
        } catch (e: any) {
          return { wallet, error: e.message }
        }
      })
    )

    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/batch',
    method: 'POST',
    body: {
      wallets: ['address1', 'address2', '...'],
    },
    limits: {
      maxWallets: 10,
    },
    example: `curl -X POST https://blockscore.vercel.app/api/batch -H "Content-Type: application/json" -d '{"wallets":["vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"]}'`
  })
}
