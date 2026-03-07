import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Instagram Reels Dashboard',
  description: 'Deine gespeicherten Reels – kategorisiert und von Gemini analysiert',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
