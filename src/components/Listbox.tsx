'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { fill } from '@/i18n'
import { anchorPopover } from '@/lib/anchor'

/**
 * The dropdown every select-shaped control in the app uses: gender, language,
 * religion, relationship, nationality, phone country code, and the month and
 * year pickers inside the date field.
 *
 * Built on the native popover API rather than a library. That hands us
 * click-outside dismissal, Escape, and the top layer — the last one matters
 * most here, because a dropdown inside a form with a sticky header would
 * otherwise be clipped by an ancestor's overflow or lose a z-index argument.
 *
 * What is left to do by hand is the ARIA combobox pattern and arrow-key
 * movement, which is the part no popover can supply.
 */

export type ListboxOption = {
  value: string
  label: string
  /** Secondary text, right-aligned — the dial code on a country, for instance. */
  hint?: string
  prefix?: React.ReactNode
}

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  options: readonly ListboxOption[]
  placeholder: string
  /** Adds a filter box. Worth it past roughly a dozen options. */
  searchable?: boolean
  /** Lets the typed query be accepted as-is, for free-text fields like nationality. */
  allowCustom?: boolean
  labels: { search: string; empty: string; use: string }
  className?: string
  invalid?: boolean
  describedBy?: string
  required?: boolean
  onBlur?: () => void
  /** For a control with no visible <label>, such as the phone country code. */
  ariaLabel?: string
  /** Rendered in the trigger instead of the plain label. */
  renderValue?: (option: ListboxOption | undefined) => React.ReactNode
}

const TRIGGER =
  'flex w-full items-center gap-2 rounded-xl border-2 bg-white px-4 py-3 text-left text-base text-ink ' +
  'transition-colors focus:outline-none focus:shadow-ring'

export function Listbox({
  id,
  value,
  onChange,
  options,
  placeholder,
  searchable,
  allowCustom,
  labels,
  className,
  invalid,
  describedBy,
  required,
  onBlur,
  ariaLabel,
  renderValue,
}: Props) {
  const panelId = `${id}-listbox`
  const reactId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (option) => option.label.toLowerCase().includes(q) || option.hint?.toLowerCase().includes(q),
    )
  }, [options, query])

  const selected = options.find((option) => option.value === value)

  // The popover can also be closed by the platform — light dismiss, Escape — so
  // the open flag is synced from the element's own toggle event rather than
  // being guessed at the call sites.
  useEffect(() => {
    const element = panel.current
    if (!element) return
    const onToggle = (event: Event) => setOpen((event as ToggleEvent).newState === 'open')
    element.addEventListener('toggle', onToggle)
    return () => element.removeEventListener('toggle', onToggle)
  }, [])

  useEffect(() => {
    if (open && searchable) search.current?.focus()
  }, [open, searchable])

  const show = () => {
    const element = panel.current
    if (!element || !trigger.current) return
    anchorPopover(element, trigger.current)

    setQuery('')
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    element.showPopover()
  }

  const commit = (next: string) => {
    onChange(next)
    panel.current?.hidePopover()
    trigger.current?.focus()
  }

  const move = (delta: number) => {
    if (filtered.length === 0) return
    setActive((current) => {
      const next = current + delta
      if (next < 0) return filtered.length - 1
      if (next >= filtered.length) return 0
      return next
    })
  }

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') return event.preventDefault(), move(1)
    if (event.key === 'ArrowUp') return event.preventDefault(), move(-1)
    if (event.key === 'Home') return event.preventDefault(), setActive(0)
    if (event.key === 'End') return event.preventDefault(), setActive(filtered.length - 1)
    if (event.key === 'Enter') {
      event.preventDefault()
      const option = filtered[active]
      if (option) return commit(option.value)
      if (allowCustom && query.trim()) return commit(query.trim())
    }
  }

  const state = invalid
    ? 'border-state-error'
    : open
      ? 'border-brand'
      : 'border-brand-wash hover:border-brand-tint'

  return (
    <>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        aria-label={ariaLabel}
        onClick={show}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            show()
          }
        }}
        className={`${TRIGGER} ${state} ${className ?? ''}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-muted'}`}>
          {renderValue ? renderValue(selected) : (selected?.label ?? placeholder)}
        </span>
        <svg
          viewBox="0 0 16 16"
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3.5 6L8 10.5 12.5 6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-brand"
          />
        </svg>
      </button>

      <div
        ref={panel}
        id={panelId}
        popover="auto"
        onKeyDown={onPanelKeyDown}
        className="listbox-panel border border-brand-wash bg-white shadow-lift"
      >
        {searchable && (
          <div className="border-b border-brand-wash p-2">
            <input
              ref={search}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              placeholder={labels.search}
              aria-label={labels.search}
              className="w-full rounded-lg bg-brand-wash/60 px-3 py-2 text-base text-ink placeholder:text-muted focus:outline-none focus:shadow-ring"
            />
          </div>
        )}

        <ul role="listbox" aria-labelledby={id} className="max-h-full overflow-y-auto overscroll-contain p-1.5">
          {filtered.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="option"
                  id={`${reactId}-${index}`}
                  aria-selected={isSelected}
                  onClick={() => commit(option.value)}
                  onMouseEnter={() => setActive(index)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base transition-colors ${
                    isSelected
                      ? 'bg-brand text-white'
                      : index === active
                        ? 'bg-brand-wash text-navy-900'
                        : 'text-ink'
                  }`}
                >
                  {option.prefix && <span className="shrink-0 text-lg leading-none">{option.prefix}</span>}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint && (
                    <span className={`shrink-0 text-sm ${isSelected ? 'text-white/80' : 'text-muted'}`}>
                      {option.hint}
                    </span>
                  )}
                </button>
              </li>
            )
          })}

          {filtered.length === 0 && (
            <li role="none" className="px-3 py-6 text-center text-sm text-muted">
              {allowCustom && query.trim() ? (
                <button
                  type="button"
                  onClick={() => commit(query.trim())}
                  className="font-semibold text-brand underline underline-offset-4"
                >
                  {fill(labels.use, { value: query.trim() })}
                </button>
              ) : (
                labels.empty
              )}
            </li>
          )}
        </ul>
      </div>
    </>
  )
}
