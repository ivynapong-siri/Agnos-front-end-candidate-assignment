import Link from 'next/link'
import { fill, type Dictionary, type Locale } from '@/i18n'
import type { Connection } from '@/lib/realtime'

const STYLE: Record<Connection, { chip: string; dot: string; pulse: boolean }> = {
  live: { chip: 'bg-state-ok/10 text-state-ok', dot: 'bg-state-ok', pulse: true },
  connecting: { chip: 'bg-brand-wash text-brand', dot: 'bg-brand', pulse: true },
  error: { chip: 'bg-state-warn/10 text-state-warn', dot: 'bg-state-warn', pulse: true },
  off: { chip: 'bg-muted/20 text-ink/70', dot: 'bg-muted', pulse: false },
}

export function LiveIndicator({ connection, dict }: { connection: Connection; dict: Dictionary }) {
  const style = STYLE[connection]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.chip}`}
      aria-live="polite"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot} ${style.pulse ? 'animate-breathe' : ''}`} />
      {/*
        The label is the dot's meaning, not decoration, so it never leaves the
        accessibility tree — it only stops taking layout below sm. At 375 it was
        105px of a 327px row, which squeezed "answered 2 of 9" onto two lines and
        pushed the sticky bar to 82px tall. On a phone that is a tenth of the
        screen permanently covered, and anything scrolled under it cannot be
        tapped.
      */}
      <span className="hidden sm:inline">{dict.connection[connection]}</span>
      <span className="sr-only sm:hidden">{dict.connection[connection]}</span>
    </span>
  )
}

/**
 * Shown instead of a silently dead page when the Supabase keys are missing.
 * The form still validates and submits locally — only the sync is off.
 */
export function SetupNotice({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <div className="mb-6 rounded-2xl border border-state-warn/30 bg-state-warn/5 p-4 text-sm text-ink sm:p-5">
      <p className="font-semibold text-navy-900">{dict.setup.title}</p>
      <p className="mt-1 text-ink/80">
        {fill(dict.setup.body, { example: '.env.example', local: '.env.local' })}
      </p>
      <Link
        href={`/${locale}`}
        className="mt-3 inline-block font-semibold text-brand underline decoration-brand-tint underline-offset-4"
      >
        {dict.setup.back}
      </Link>
    </div>
  )
}
