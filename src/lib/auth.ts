import { z } from 'zod'
import { fill } from '@/i18n'

/**
 * Staff sign-in, registration and password reset.
 *
 * There is no auth server. The brief is a front-end exercise with no backend
 * beyond the realtime channel, so this validates properly, holds a real session
 * and gates nothing it cannot honestly gate — and every screen says so in as
 * many words. A login that pretended to be real would be worse than none: the
 * front desk would trust it.
 *
 * What IS real here: the validation rules, the session lifetime, and the sign
 * out. What is not: the credential check, which compares against the sample
 * account below, and the reset email, which is never sent.
 */

export const MIN_PASSWORD = 8
export const MAX_FIELD = 120

/**
 * The one account this demo recognises, and what the "fill it in for me" tick
 * box writes into the form. Printed on the sign-in screen too — a reviewer
 * should never have to guess a password to see the page behind it.
 */
export const SAMPLE_STAFF = {
  name: 'ณิชา พงษ์สวัสดิ์',
  email: 'napong.sirivat@gmail.com',
  password: 'agnos-demo-2026',
  invite: 'AGNOS-DESK',
} as const

export type AuthMessages = {
  required: string
  emailInvalid: string
  passwordShort: string
  passwordMismatch: string
  inviteInvalid: string
  wrongCredentials: string
}

export type StaffAccount = { name: string; email: string }

/* ------------------------------------------------------------------ *
 * Session
 * ------------------------------------------------------------------ */

const SESSION_KEY = 'agnos.staff'

/**
 * Defaults to sessionStorage, because a front desk is a shared machine: whoever
 * closes the browser should be signed out rather than leaving their session for
 * the next person on shift.
 *
 * "Keep me signed in" is what moves it to localStorage. That makes the tick box
 * mean something — a checkbox that changed nothing would be the same small lie
 * as a Google button that does not sign anybody in.
 */
function parse(raw: string | null): StaffAccount | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const { name, email } = parsed as Partial<StaffAccount>
    return typeof name === 'string' && typeof email === 'string' ? { name, email } : null
  } catch {
    // Corrupt or unreadable is the same as signed out.
    return null
  }
}

export function readStaffSession(): StaffAccount | null {
  if (typeof window === 'undefined') return null
  return parse(sessionStorage.getItem(SESSION_KEY)) ?? parse(localStorage.getItem(SESSION_KEY))
}

export function writeStaffSession(account: StaffAccount, keepSignedIn = false): void {
  const store = keepSignedIn ? localStorage : sessionStorage
  // Written to one and cleared from the other, so ticking or unticking on a
  // later sign in cannot leave two sessions disagreeing about who is here.
  store.setItem(SESSION_KEY, JSON.stringify(account))
  ;(keepSignedIn ? sessionStorage : localStorage).removeItem(SESSION_KEY)
  // Same-tab listeners: the storage event only fires in *other* tabs.
  window.dispatchEvent(new Event(STAFF_SESSION_EVENT))
}

export function clearStaffSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(STAFF_SESSION_EVENT))
}

export const STAFF_SESSION_EVENT = 'agnos:staff-session'

/* --- reading it from React ------------------------------------------ *
 *
 * useSyncExternalStore needs a snapshot with a stable identity: readStaffSession
 * parses fresh every call, and returning a new object each time would re-render
 * forever. So the parsed value is cached against the raw string and only rebuilt
 * when the stored text actually changes.
 */

let cachedRaw: string | null | undefined
let cached: StaffAccount | null = null

export function staffSnapshot(): StaffAccount | null {
  const raw =
    typeof window === 'undefined'
      ? null
      : (sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY))
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cached = parse(raw)
  }
  return cached
}

/** Server render has no storage, so nobody is signed in yet. */
export function staffServerSnapshot(): StaffAccount | null {
  return null
}

export function subscribeStaffSession(onChange: () => void): () => void {
  window.addEventListener(STAFF_SESSION_EVENT, onChange)
  // storage fires in *other* tabs; the custom event covers this one.
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(STAFF_SESSION_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** Whether these credentials match the sample account. */
export function credentialsMatch(email: string, password: string): boolean {
  return email.trim().toLowerCase() === SAMPLE_STAFF.email && password === SAMPLE_STAFF.password
}

/* ------------------------------------------------------------------ *
 * Validation
 *
 * Locale factories, the same shape as makePatientSchema: the messages come from
 * the dictionary so a mid-form language switch re-renders the errors in the new
 * language rather than leaving the old one behind.
 * ------------------------------------------------------------------ */

const trimmed = (message: string) => z.string().trim().min(1, message).max(MAX_FIELD)

function emailField(messages: AuthMessages) {
  return trimmed(messages.required).refine(
    (value) => z.email().safeParse(value).success,
    messages.emailInvalid,
  )
}

export function makeLoginSchema(messages: AuthMessages) {
  return z.object({
    email: emailField(messages),
    password: z.string().min(1, messages.required),
    remember: z.boolean(),
  })
}

export function makeRegisterSchema(messages: AuthMessages) {
  return z
    .object({
      name: trimmed(messages.required),
      email: emailField(messages),
      invite: trimmed(messages.required),
      password: z.string().min(MIN_PASSWORD, fill(messages.passwordShort, { min: MIN_PASSWORD })),
      confirm: z.string().min(1, messages.required),
    })
    // Reported on `confirm`, which is the field the person can actually fix.
    .refine((values) => values.password === values.confirm, {
      message: messages.passwordMismatch,
      path: ['confirm'],
    })
    .refine((values) => values.invite.trim().toUpperCase() === SAMPLE_STAFF.invite, {
      message: messages.inviteInvalid,
      path: ['invite'],
    })
}

export function makeResetSchema(messages: AuthMessages) {
  return z.object({ email: emailField(messages) })
}

export type LoginForm = z.infer<ReturnType<typeof makeLoginSchema>>
export type RegisterForm = z.infer<ReturnType<typeof makeRegisterSchema>>
export type ResetForm = z.infer<ReturnType<typeof makeResetSchema>>
