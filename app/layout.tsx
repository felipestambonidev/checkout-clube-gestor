import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL('https://checkout.clubegestor.com'),
  title: 'Checkout - Clube Gestor',
  description: 'Criado para gerenciar inscrições e pagamentos de eventos do Clube Gestor.',
  generator: 'v0.app',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://checkout.clubegestor.com/',
    siteName: 'Clube Gestor',
    title: 'Checkout - Clube Gestor',
    description: 'Criado para gerenciar inscrições e pagamentos de eventos do Clube Gestor.',
    images: [
      {
        url: '/images/clubegestoriconelink.png',
        width: 1200,
        height: 630,
        alt: 'Checkout - Clube Gestor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Checkout - Clube Gestor',
    description: 'Criado para gerenciar inscrições e pagamentos de eventos do Clube Gestor.',
    images: ['/images/clubegestoriconelink.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
