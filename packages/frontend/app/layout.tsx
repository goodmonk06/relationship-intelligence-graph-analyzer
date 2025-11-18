import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Relationship Intelligence Graph Analyzer',
  description: 'Analyze and visualize relationship networks in CRM data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
