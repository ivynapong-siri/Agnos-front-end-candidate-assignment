'use client'

import { useEffect, useRef, useState } from 'react'
import type { Dictionary, Locale } from '@/i18n'
import { anchorPopover, keepAnchored } from '@/lib/anchor'
import {
  formatLongDate,
  fromIsoDate,
  monthGrid,
  monthNames,
  toIsoDate,
  weekdayNames,
} from '@/lib/calendar'

/**
 * The date picker, replacing <input type="date"> so the calendar matches the
 * rest of the UI instead of being browser chrome.
 *
 * Three modes in one panel — years, then months, then days — rather than
 * dropdowns inside the calendar. That avoids nesting one popover inside another,
 * and for a date of birth it is also the faster path: a patient born in 1961
 * reaches their year in one tap instead of paging back sixty-five months.
 */

const TRIGGER =
  'flex w-full items-center gap-2 rounded-xl border-2 bg-white px-4 py-3 text-left text-base ' +
  'transition-colors focus:outline-none focus:shadow-ring'

const CELL =
  'grid h-11 place-items-center rounded-xl text-base transition-colors focus:outline-none focus-visible:shadow-ring'

type Mode = 'days' | 'months' | 'years'

export function DateField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  dict,
  locale,
  maxAge,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
  dict: Dictionary
  locale: Locale
  maxAge: number
}) {
  const panelId = `${id}-calendar`
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('days')
  const untrack = useRef<(() => void) | null>(null)

  // Captured once per mount. Reading a ref during render is not allowed, and
  // it must not change between renders or the disabled future dates would shift.
  const [today] = useState(() => new Date())
  const selected = fromIsoDate(value)
  const [view, setView] = useState(() => {
    const start = fromIsoDate(value) ?? new Date()
    return { year: start.getFullYear(), month: start.getMonth() }
  })

  useEffect(() => {
    const element = panel.current
    if (!element) return
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === 'open'
      setOpen(isOpen)
      if (!isOpen) setMode('days')
      // Re-anchor while open so scrolling does not leave the calendar behind.
      untrack.current?.()
      untrack.current = isOpen && trigger.current ? keepAnchored(element, trigger.current, 304) : null
    }
    element.addEventListener('toggle', onToggle)
    return () => {
      untrack.current?.()
      element.removeEventListener('toggle', onToggle)
    }
  }, [])

  const show = () => {
    if (!panel.current || !trigger.current) return
    const start = fromIsoDate(value) ?? new Date()
    setView({ year: start.getFullYear(), month: start.getMonth() })
    setMode(value ? 'days' : 'years')
    anchorPopover(panel.current, trigger.current, 304)
    panel.current.showPopover()
  }

  const pick = (iso: string) => {
    onChange(iso)
    panel.current?.hidePopover()
    trigger.current?.focus()
  }

  const shiftMonth = (delta: number) =>
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })

  const months = monthNames(locale)
  const weekdays = weekdayNames(locale)
  // Newest first: a patient scrolls back to their birth year, not forward.
  const years = Array.from({ length: maxAge + 1 }, (_, index) => today.getFullYear() - index)

  const state = invalid
    ? 'border-state-error'
    : open
      ? 'border-brand'
      : 'border-line hover:border-brand'

  return (
    <>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={describedBy}
        onClick={show}
        onBlur={onBlur}
        className={`${TRIGGER} ${state} ${value ? 'text-ink' : 'text-muted'}`}
      >
        <span className="min-w-0 flex-1 truncate">
          {value ? formatLongDate(value, locale) : dict.picker.chooseDate}
        </span>
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="3" strokeWidth="1.8" className="stroke-brand" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeWidth="1.8" strokeLinecap="round" className="stroke-brand" />
        </svg>
      </button>

      <div
        ref={panel}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-label={dict.picker.chooseDate}
        className="listbox-panel border border-brand-wash bg-white p-3 shadow-lift"
      >
        <div className="flex items-center gap-1 pb-2">
          <button
            type="button"
            onClick={() => setMode(mode === 'days' ? 'years' : 'days')}
            aria-expanded={mode !== 'days'}
            className="flex min-h-11 flex-1 items-center gap-1.5 rounded-xl px-3 text-left font-bold text-navy-900 transition-colors hover:bg-brand-wash"
          >
            {mode === 'years' ? dict.picker.year : `${months[view.month]} ${view.year}`}
            <svg
              viewBox="0 0 16 16"
              className={`h-3.5 w-3.5 transition-transform ${mode === 'days' ? '' : 'rotate-180'}`}
              fill="none"
              aria-hidden="true"
            >
              <path d="M3.5 6L8 10.5 12.5 6" strokeWidth="2" strokeLinecap="round" className="stroke-brand" />
            </svg>
          </button>

          {mode === 'days' && (
            <>
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label={dict.picker.prevMonth}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors hover:bg-brand-wash"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M10 3L5 8l5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label={dict.picker.nextMonth}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors hover:bg-brand-wash"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand" />
                </svg>
              </button>
            </>
          )}
        </div>

        {mode === 'days' && (
          <>
            <div className="grid grid-cols-7 pb-1">
              {weekdays.map((day, index) => (
                <span key={index} className="grid h-8 place-items-center text-xs font-semibold text-muted">
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {monthGrid(view.year, view.month).map((cell) => {
                const isSelected = cell.iso === value
                const isToday = cell.iso === toIsoDate(today)
                const future = cell.date > today
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={future}
                    aria-current={isToday ? 'date' : undefined}
                    onClick={() => pick(cell.iso)}
                    className={`${CELL} ${
                      isSelected
                        ? 'bg-brand font-bold text-white'
                        : future
                          ? 'cursor-not-allowed text-muted/40'
                          : cell.inMonth
                            ? 'text-ink hover:bg-brand-wash'
                            : 'text-muted hover:bg-brand-wash'
                    } ${isToday && !isSelected ? 'ring-1 ring-inset ring-brand' : ''}`}
                  >
                    {cell.date.getDate()}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {mode === 'months' && (
          <div className="grid grid-cols-3 gap-1">
            {months.map((name, month) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setView((current) => ({ ...current, month }))
                  setMode('days')
                }}
                className={`${CELL} px-1 text-sm ${
                  month === view.month ? 'bg-brand font-bold text-white' : 'text-ink hover:bg-brand-wash'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {mode === 'years' && (
          <div className="grid max-h-[13rem] grid-cols-4 gap-1 overflow-y-auto overscroll-contain">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  setView((current) => ({ ...current, year }))
                  setMode('months')
                }}
                className={`${CELL} text-sm ${
                  year === view.year ? 'bg-brand font-bold text-white' : 'text-ink hover:bg-brand-wash'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <button
            type="button"
            onClick={() => pick('')}
            className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-brand transition-colors hover:bg-brand-wash"
          >
            {dict.picker.clear}
          </button>
        )}
      </div>
    </>
  )
}
