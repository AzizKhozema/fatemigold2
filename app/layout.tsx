
import './globals.css' // Global styles and CSS variables
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/AuthContext'

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600'],
})

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title:       'Fatemi Gold — Business Suite',
  description: 'Complete business management system for Fatemi Gold',
  manifest:    '/manifest.json',
  themeColor:  '#C9A84C',
  appleWebApp: {
    capable:          true,
    statusBarStyle:   'black-translucent',
    title:            'Fatemi Gold',
  },
  viewport: {
    width:               'device-width',
    initialScale:        1,
    maximumScale:        1,
    userScalable:        false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
      <link rel="apple-touch-icon" href="/icon-192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Fatemi Gold" />
    </head>
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}