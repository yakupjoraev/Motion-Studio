import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--ms-font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--ms-font-mono',
  display: 'swap',
})

const colorMode =
  "try{var m=localStorage.getItem('ms-color-mode');if(m==='light'||m==='dark'){document.documentElement.dataset.colorMode=m}}catch(e){}"

export const metadata: Metadata = {
  title: 'Fixture',
  description: 'Fixture, built with Motion Studio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-mode="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorMode }} />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
