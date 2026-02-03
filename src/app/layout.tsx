import './globals.css'
import { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'BlockScore | On-Chain Reputation Intelligence',
  description: 'Institutional-grade wallet reputation scoring for the Solana ecosystem. Powered by on-chain analytics.',
  openGraph: {
    title: 'BlockScore',
    description: 'On-chain wallet reputation intelligence',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlockScore',
    description: 'Institutional-grade wallet reputation scoring',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
