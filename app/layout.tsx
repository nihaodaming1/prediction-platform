import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prediction Platform',
  description: 'A forecasting platform like Polymarket',
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