import { IDLE_AFTER_MS, INACTIVE_AFTER_MS, type PatientStatus } from '@/lib/realtime'

/**
 * Presence states, as a lookup table. Colour is never the only signal — every
 * badge carries its label as text (WCAG 1.4.1), and the tooltip explains the
 * threshold so staff can trust what they are seeing.
 */
export const STATUS: Record<
  PatientStatus,
  { label: string; short: string; chip: string; dot: string; pulse: boolean; title: string }
> = {
  filling: {
    label: 'Actively filling',
    short: 'Filling',
    chip: 'bg-brand-wash text-brand',
    dot: 'bg-brand',
    pulse: true,
    title: `Typed within the last ${IDLE_AFTER_MS / 1000} seconds`,
  },
  idle: {
    label: 'Paused',
    short: 'Paused',
    chip: 'bg-state-warn/10 text-state-warn',
    dot: 'bg-state-warn',
    pulse: false,
    title: `No input for ${IDLE_AFTER_MS / 1000}s or more, still on the page`,
  },
  inactive: {
    label: 'Inactive',
    short: 'Inactive',
    chip: 'bg-muted/20 text-ink/70',
    dot: 'bg-muted',
    pulse: false,
    title: `No input for ${INACTIVE_AFTER_MS / 1000}s or more — may need help`,
  },
  submitted: {
    label: 'Submitted',
    short: 'Submitted',
    chip: 'bg-state-ok/10 text-state-ok',
    dot: 'bg-state-ok',
    pulse: false,
    title: 'Form completed and submitted',
  },
  disconnected: {
    label: 'Left the form',
    short: 'Left',
    chip: 'bg-navy-950/10 text-navy-900/70',
    dot: 'bg-navy-900/40',
    pulse: false,
    title: 'Closed the page before submitting',
  },
}

export const STATUS_ORDER: PatientStatus[] = ['filling', 'idle', 'inactive', 'submitted', 'disconnected']

export function StatusBadge({ status }: { status: PatientStatus }) {
  const meta = STATUS[status]
  return (
    <span
      title={meta.title}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot} ${meta.pulse ? 'animate-breathe' : ''}`} />
      {meta.label}
    </span>
  )
}
