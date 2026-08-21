'use client'

import { useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Dictionary, Locale } from '@/i18n'
import { staffServerSnapshot, staffSnapshot, subscribeStaffSession } from '@/lib/auth'

/**
 * The desk view is a list of patients' names, phone numbers and addresses, so it
 * asks who you are before it draws any of it.
 *
 * Three states, not two. `undefined` is "storage not read yet" — the value the
 * prerendered HTML carries — and it renders nothing rather than guessing. Were it
 * folded into "signed out", every signed-in visitor would see a sign-in wall
 * flash before the board appeared, and every crawler would be redirected.
 *
 * Honest about what this is: a client-side gate on a statically served page. It
 * enforces the flow, and someone determined can still read the page source. Real
 * enforcement needs the data to arrive from a server that checked a session
 * first, which is a backend this brief does not have. What it does do is stop
 * the board being a URL anybody can wander into.
 */
export function RequireStaff({
  locale,
  dict,
  children,
}: {
  locale: Locale
  dict: Dictionary
  children: React.ReactNode
}) {
  const account = useSyncExternalStore(subscribeStaffSession, staffSnapshot, staffServerSnapshot)
  const router = useRouter()
  const signedOut = account === null

  useEffect(() => {
    if (signedOut) router.replace(`/${locale}/staff/login`)
  }, [signedOut, locale, router])

  // Not known yet: the first paint, and the frame hydration runs on.
  if (account === undefined) return null

  if (signedOut) {
    // Shown for the moment the redirect takes, and it is also the whole fallback
    // if client routing never gets there — so it carries a real link, not a
    // spinner.
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-navy-900">{dict.auth.session.gateTitle}</h1>
        <p className="mt-3 text-sm text-ink/80">{dict.auth.session.gateBody}</p>
        <Link
          href={`/${locale}/staff/login`}
          className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-6 font-bold text-white transition-colors hover:bg-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {dict.auth.session.signIn}
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
