import { NextResponse } from 'next/server'
import { calculateScore } from '@/lib/score'

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
    const result = await calculateScore(wallet)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to calculate score' }, { status: 500 })
  }
}
