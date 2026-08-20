import { fill, type Dictionary } from '@/i18n'
import { IDLE_AFTER_MS, INACTIVE_AFTER_MS, type PatientStatus } from '@/lib/realtime'

/**
 * Presence states, as a lookup table. Colour is never the only signal — every
 * badge carries its label as text (WCAG 1.4.1), and the tooltip names the
 * threshold so staff can trust what they are seeing.
 */
export const STATUS_STYLE: Record<PatientStatus, { chip: string; dot: string; pulse: boolean }> = {
  filling: { chip: 'bg-brand-wash text-brand', dot: 'bg-brand', pulse: true },
  idle: { chip: 'bg-state-warn/10 text-state-warn', dot: 'bg-state-warn', pulse: false },
  inactive: { chip: 'bg-muted/20 text-ink/70', dot: 'bg-muted', pulse: false },
  submitted: { chip: 'bg-state-ok/10 text-state-ok', dot: 'bg-state-ok', pulse: false },
  disconnected: { chip: 'bg-navy-950/10 text-navy-900/70', dot: 'bg-navy-900/40', pulse: false },
}

export const STATUS_ORDER: PatientStatus[] = ['filling', 'idle', 'inactive', 'submitted', 'disconnected']

/** Thresholds are interpolated, so the copy cannot drift from the constants. */
export function statusTitle(dict: Dictionary, status: PatientStatus): string {
  return fill(dict.status[status].title, {
    idle: IDLE_AFTER_MS / 1000,
    inactive: INACTIVE_AFTER_MS / 1000,
  })
}

export function StatusBadge({ status, dict }: { status: PatientStatus; dict: Dictionary }) {
  const style = STATUS_STYLE[status]
  return (
    <span
      title={statusTitle(dict, status)}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.chip}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot} ${style.pulse ? 'animate-breathe' : ''}`} />
      {dict.status[status].label}
    </span>
  )
}
