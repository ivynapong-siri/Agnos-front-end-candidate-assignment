import Link from 'next/link'
import type { Connection } from '@/lib/realtime'

const LABEL: Record<Connection, { text: string; chip: string; dot: string; pulse: boolean }> = {
  live: { text: 'Live', chip: 'bg-state-ok/10 text-state-ok', dot: 'bg-state-ok', pulse: true },
  connecting: { text: 'Connecting…', chip: 'bg-brand-wash text-brand', dot: 'bg-brand', pulse: true },
  error: { text: 'Reconnecting…', chip: 'bg-state-warn/10 text-state-warn', dot: 'bg-state-warn', pulse: true },
  off: { text: 'Sync off', chip: 'bg-muted/20 text-ink/70', dot: 'bg-muted', pulse: false },
}

export function LiveIndicator({ connection }: { connection: Connection }) {
  const meta = LABEL[connection]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}
      aria-live="polite"
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot} ${meta.pulse ? 'animate-breathe' : ''}`} />
      {meta.text}
    </span>
  )
}

/**
 * Shown instead of a silently dead page when the Supabase keys are missing.
 * The form still validates and submits locally — only the sync is off.
 */
export function SetupNotice() {
  return (
    <div className="mb-6 rounded-2xl border border-state-warn/30 bg-state-warn/5 p-4 text-sm leading-6 text-ink sm:p-5">
      <p className="font-semibold text-navy-900">Real-time sync is switched off</p>
      <p className="mt-1 text-ink/80">
        No Supabase credentials are set, so this page cannot talk to the other one. Copy{' '}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-brand">.env.example</code> to{' '}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-brand">.env.local</code>, add your project
        URL and anon key, and restart the dev server. Everything else on this page works without it.
      </p>
      <Link href="/" className="mt-3 inline-block font-semibold text-brand underline decoration-brand-tint underline-offset-4">
        Back to start
      </Link>
    </div>
  )
}
