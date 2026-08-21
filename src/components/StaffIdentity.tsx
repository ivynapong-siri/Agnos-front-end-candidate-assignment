'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { fill, type Dictionary, type Locale } from '@/i18n'
import {
  clearStaffSession,
  staffServerSnapshot,
  staffSnapshot,
  subscribeStaffSession,
} from '@/lib/auth'

/**
 * Who is at the desk, on the desk view.
 *
 * useSyncExternalStore rather than an effect: the session lives outside React,
 * in storage, and this reads it without the mounted-flag dance — the server
 * snapshot is "nobody", so the first client paint agrees with the HTML and there
 * is nothing for hydration to disagree about.
 *
 * Signed out shows a link rather than a wall. The board is the deliverable of
 * this exercise, and locking a reviewer out of it behind a sign-in that cannot
 * really authenticate anybody would trade the thing being assessed for a
 * gesture at security. Said plainly on the sign-in screen too.
 */
export function StaffIdentity({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const account = useSyncExternalStore(subscribeStaffSession, staffSnapshot, staffServerSnapshot)

  if (!account) {
    return (
      <Link
        href={`/${locale}/staff/login`}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-wash bg-white px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand-wash focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {dict.auth.session.signIn}
      </Link>
    )
  }

  return (
    <span className="inline-flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-brand-wash px-4 py-1.5 text-sm">
      <span className="font-semibold text-navy-900">
        {fill(dict.auth.session.signedInAs, { name: account.name })}
      </span>
      <button
        type="button"
        onClick={clearStaffSession}
        // min-h-11: it is a standalone control, not a link inside a sentence,
        // so it owes the same 44px the rest of the app keeps to. It measured 26.
        className="inline-flex min-h-11 items-center rounded px-1 font-semibold text-brand underline underline-offset-4 transition-colors hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {dict.auth.session.signOut}
      </button>
    </span>
  )
}
