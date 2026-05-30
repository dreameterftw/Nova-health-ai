import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { EmotionProvider } from '@/contexts/EmotionContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300','400','500','600','700'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400','500','600','700','800','900'],
})

export const metadata: Metadata = {
  title: 'NOVA — AI Health Intelligence',
  description: 'Emotion-aware conversations, medical report analysis, and personalised recovery plans. Your private AI health companion.',
  keywords: ['health AI', 'mental wellness', 'medical AI', 'emotion monitoring', 'recovery assistant', 'NOVA'],
  openGraph: {
    title: 'NOVA — AI Health Intelligence',
    description: 'Your private AI health companion — emotion-aware, medical-grade, always available.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#F8F9FC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${outfit.variable} bg-[#F8F9FC]`}>
      <body className="font-sans antialiased text-[#0F172A]">
        <AuthProvider>
          <EmotionProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </EmotionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
