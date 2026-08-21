import { ContactDock } from './ContactDock'
import { GlassButton } from './GlassButton'
import type { Dictionary } from '@/i18n'

/**
 * The "any questions?" widget, bottom-right on every page.
 *
 * No 'use client' and no useState: this is built on the native popover API, so
 * the browser supplies click-outside dismissal, Escape to close, focus handling
 * and top-layer stacking. Doing it by hand would be a state flag, an outside
 * click listener, a key handler and a z-index argument — all of it already in
 * the platform.
 *
 * Adapted from the supplied social-card snippet: same idea of a trigger that
 * fans channels out on a stagger, same prop-driven channel list. Its CSS was
 * never included, so the look here is written against this project's palette
 * (see .contact-* rules in globals.css).
 */

const PANEL_ID = 'contact-panel'

export type ContactChannel = {
  href: string
  label: string
  detail: string
  icon: React.ReactNode
  /** Staggers the fan-out, as in the original snippet. */
  delay?: string
}

const stroke = {
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'stroke-brand',
}

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
    <path d="M7 3h3l2 5-2.5 1.5a11 11 0 005 5L16 12l5 2v3a2 2 0 01-2 2A16 16 0 015 5a2 2 0 012-2z" {...stroke} />
  </svg>
)

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
    <path d="M21 12c0 4-4 7-9 7a10 10 0 01-2.6-.34L5 21l.9-3.2A7.5 7.5 0 013 12c0-4 4-7 9-7s9 3 9 7z" {...stroke} />
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" {...stroke} />
    <path d="M4 7l8 6 8-6" {...stroke} />
  </svg>
)

const QuestionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <path
      d="M21 11.5c0 4.1-4 7.5-9 7.5a10 10 0 01-2.7-.36L4.5 21l1-3.4A7.6 7.6 0 013 11.5C3 7.4 7 4 12 4s9 3.4 9 7.5z"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="stroke-white"
    />
    <path d="M10 9.4a2.1 2.1 0 013.9 1c0 1.4-1.9 1.5-1.9 2.9" strokeWidth="1.8" strokeLinecap="round" className="stroke-white" />
    <circle cx="12" cy="15.6" r="0.9" className="fill-white" />
  </svg>
)

/**
 * Placeholders on purpose: 02-000-0000 is unassigned and example.com is
 * reserved by RFC 2606, so nothing here can dial or mail a real person.
 * Replace all three before this is shown to a patient.
 */
export function defaultChannels(dict: Dictionary): ContactChannel[] {
  return [
    { href: 'tel:+6620000000', label: dict.contact.phone, detail: '02-000-0000', icon: <PhoneIcon /> },
    { href: 'https://line.me/R/ti/p/@example', label: dict.contact.line, detail: '@example', icon: <ChatIcon />, delay: '60ms' },
    { href: 'mailto:support@example.com', label: dict.contact.email, detail: 'support@example.com', icon: <MailIcon />, delay: '120ms' },
  ]
}

export function ContactCard({ dict, channels }: { dict: Dictionary; channels?: ContactChannel[] }) {
  const list = channels ?? defaultChannels(dict)

  return (
    <>
      {/* Popovers render in the top layer, positioned against the viewport
          rather than this element — so the panel places itself in globals.css
          instead of being anchored here. */}
      <div
        id={PANEL_ID}
        popover="auto"
        className="contact-panel rounded-3xl border border-brand-wash bg-white p-4 shadow-lift"
      >
        <p className="text-sm font-bold text-navy-900">{dict.contact.title}</p>
        <p className="mt-1 text-xs text-muted">{dict.contact.blurb}</p>

        <ul className="mt-3 space-y-1.5">
          {list.map((channel) => (
            <li key={channel.href} className="contact-channel" style={{ transitionDelay: channel.delay }}>
              <a
                href={channel.href}
                className="flex min-h-11 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-brand-wash focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-wash">
                  {channel.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-navy-900">{channel.label}</span>
                  <span className="block truncate text-xs text-muted">{channel.detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <ContactDock>
        <GlassButton
          type="button"
          popoverTarget={PANEL_ID}
          className="contact-trigger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <QuestionIcon />
          <span className="text-sm">{dict.contact.open}</span>
        </GlassButton>
      </ContactDock>
    </>
  )
}
