import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_Thai } from 'next/font/google'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

// Loaded so a patient typing their name in Thai gets proper glyphs and line
// height rather than a fallback face — the UI copy itself stays in English.
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-noto-thai', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Agnos Patient Intake', template: '%s · Agnos Patient Intake' },
  description:
    'A responsive patient intake form that mirrors every keystroke onto a live front-desk dashboard.',
}

export const viewport: Viewport = {
  themeColor: '#1A59C2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoThai.variable}`}>
      <body>
        {/* Soft brand wash behind everything. Blurred CSS circles rather than
            SVG blobs: same look, nothing to maintain. */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-wash opacity-80 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 h-[26rem] w-[26rem] rounded-full bg-brand-tint/25 blur-3xl" />
        </div>

        <header className="mx-auto flex w-full max-w-7xl items-center px-4 py-5 sm:px-6">
          <Link href="/" className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <Logo className="h-9 w-auto" />
          </Link>
        </header>

        {children}
      </body>
    </html>
  )
}
