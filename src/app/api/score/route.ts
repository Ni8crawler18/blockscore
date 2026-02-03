import { NextResponse } from 'next/server'
import { calculateScore } from '@/lib/score'

const TIMEOUT_MS = 55000 // 55s (Vercel hobby limit is 60s for edge, 300s for serverless)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const wallet = searchParams.get('wallet')
  
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
  }
  
  // Basic validation
  if (wallet.length < 32 || wallet.length > 44) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }
  
  try {
    const result = await Promise.race([
      calculateScore(wallet),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - RPC too slow')), TIMEOUT_MS)
      )
    ]) as Awaited<ReturnType<typeof calculateScore>>
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error(`[score] Error for ${wallet}:`, error.message)
    return NextResponse.json({ error: error.message || 'Failed to calculate score' }, { status: 500 })
  }
}
