import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BlockScore - On-Chain Wallet Reputation',
  description: 'Get your Solana wallet reputation score powered by ML',
  openGraph: {
    title: 'BlockScore',
    description: 'On-chain wallet reputation scores',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlockScore',
    description: 'Get your Solana wallet reputation score',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-white">{children}</body>
    </html>
  )
}
