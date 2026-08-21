'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArtDone, SectionIcon } from './Art'
import { Field } from './Field'
import { GlassButton } from './GlassButton'
import { Magnetic } from './Magnetic'
import { LiveIndicator, SetupNotice } from './LiveIndicator'
import { fill, plural, type Dictionary, type Locale } from '@/i18n'
import {
  EMPTY_FORM,
  FIELDS,
  FIELDS_BY_SECTION,
  REQUIRED_FIELDS,
  SPAN_CLASS,
  countFilled,
  displayValue,
} from '@/lib/fields'
import { makePatientSchema, type PatientForm } from '@/lib/schema'
import { realtimeConfigured, usePatientPresence } from '@/lib/realtime'

const TOTAL_REQUIRED = REQUIRED_FIELDS.length

const SESSION_KEY = 'agnos.sessionId'
const DRAFT_KEY = 'agnos.draft'

/* ------------------------------------------------------------------ *
 * Session identity and draft
 * ------------------------------------------------------------------ */

function readOrCreateSessionId() {
  const existing = sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const fresh = crypto.randomUUID()
  sessionStorage.setItem(SESSION_KEY, fresh)
  return fresh
}

/**
 * One tab = one patient. sessionStorage rather than localStorage so a second
 * tab is genuinely a second patient, while a refresh keeps the same identity
 * and staff does not see a duplicate appear.
 *
 * Read in the state initialiser rather than an effect: the id is needed on the
 * first render, and '' during SSR is safe because nothing renders it until the
 * patient submits.
 */
function useSessionId() {
  const [id, setId] = useState(() => (typeof window === 'undefined' ? '' : readOrCreateSessionId()))

  const renew = useCallback(() => {
    const fresh = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, fresh)
    setId(fresh)
  }, [])

  return { id, renew }
}

/**
 * Switching language is a real navigation — /th/patient to /en/patient — which
 * remounts the form and would otherwise throw away everything typed so far. The
 * draft makes the language toggle safe, and an accidental refresh too.
 *
 * Same lifetime as the session id: sessionStorage, so it dies with the tab,
 * which is what the privacy note on the form promises.
 */
function readDraft(): PatientForm {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return EMPTY_FORM
    const parsed = JSON.parse(raw) as Record<string, unknown>
    // Only known field names, only strings. A hand-edited draft must not be
    // able to add keys to the form or feed a non-string into an input.
    const restored = FIELDS.filter((field) => typeof parsed[field.name] === 'string').map((field) => [
      field.name,
      parsed[field.name],
    ])
    return { ...EMPTY_FORM, ...Object.fromEntries(restored) }
  } catch {
    return EMPTY_FORM
  }
}

/* ------------------------------------------------------------------ */

function ProgressBar({ filled, dict }: { filled: number; dict: Dictionary }) {
  const percent = Math.round((filled / TOTAL_REQUIRED) * 100)
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs font-medium">
        <span className="text-ink/70">{fill(dict.form.progress, { filled, total: TOTAL_REQUIRED })}</span>
        <span className="font-bold text-brand">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={dict.form.progressLabel}
        className="h-2 overflow-hidden rounded-full bg-brand-wash"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

/**
 * The only component subscribed to every field. Keeping the watch here means a
 * keystroke re-renders thirty lines instead of the whole form tree, and it puts
 * the progress bar, the outbound sync and the draft on one subscription.
 */
function LiveMirror({
  sessionId,
  startedAt,
  publish,
  dict,
}: {
  sessionId: string
  startedAt: number
  publish: ReturnType<typeof usePatientPresence>['publish']
  dict: Dictionary
}) {
  const { control } = useFormContext<PatientForm>()
  const values = useWatch({ control })
  const filled = countFilled(values)

  useEffect(() => {
    // Trailing debounce: staff sees a settled value ~250ms after typing stops,
    // which keeps us at roughly 4 messages/second against a cap of 10.
    const timer = setTimeout(() => {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values))
      if (!sessionId) return
      publish({ sessionId, data: values, submitted: false, filled, total: TOTAL_REQUIRED, startedAt })
    }, 250)
    return () => clearTimeout(timer)
  }, [values, filled, sessionId, startedAt, publish])

  return <ProgressBar filled={filled} dict={dict} />
}

/** Post-submit error summary. Silent until the patient has actually tried. */
function ErrorSummary({ dict }: { dict: Dictionary }) {
  const {
    formState: { errors, submitCount },
  } = useFormContext<PatientForm>()

  // Ordered by the manifest, not by the error object's key order, so the list
  // reads in the same order as the form.
  const broken = FIELDS.filter((field) => errors[field.name])
  if (submitCount === 0 || broken.length === 0) return null

  return (
    <div role="alert" className="rounded-2xl border border-state-error/30 bg-state-error/5 p-4">
      <p className="text-sm font-semibold text-state-error">
        {plural({ one: dict.form.errorSummary_one, other: dict.form.errorSummary_other }, broken.length)}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {broken.map((field) => (
          <li key={field.name}>
            <button
              type="button"
              onClick={() => document.getElementById(field.name)?.focus()}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-state-error underline decoration-state-error/40 underline-offset-2"
            >
              {dict.form.fields[field.name].label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ThankYou({
  values,
  reference,
  dict,
  locale,
  onStartAnother,
}: {
  values: PatientForm
  reference: string
  dict: Dictionary
  locale: Locale
  onStartAnother: () => void
}) {
  const answered = FIELDS.filter((field) => values[field.name].trim() !== '')

  return (
    <div className="animate-rise rounded-3xl border border-brand-wash bg-white p-6 text-center shadow-card sm:p-10">
      <ArtDone className="mx-auto h-28 w-28" />
      <h1 className="mt-4 text-2xl font-bold text-navy-900 sm:text-3xl">
        {fill(dict.receipt.thanks, { name: values.firstName })}
      </h1>

      {/* IxDF: say what happens next, do not just say "success". */}
      <p className="mx-auto mt-3 max-w-md text-sm text-ink/80">{dict.receipt.next}</p>
      <p className="mt-4 inline-block rounded-full bg-brand-wash px-4 py-1.5 font-mono text-sm font-bold tracking-wider text-brand">
        {reference}
      </p>

      <dl className="mx-auto mt-8 max-w-md divide-y divide-brand-wash text-left">
        {answered.map((field) => (
          <div key={field.name} className="flex gap-4 py-2.5">
            <dt className="w-2/5 shrink-0 text-xs font-semibold text-muted">{dict.form.fields[field.name].label}</dt>
            <dd className="min-w-0 break-words text-sm text-ink">
              {displayValue(field, values[field.name], dict, locale)}
            </dd>
          </div>
        ))}
      </dl>

      <GlassButton tone="secondary" type="button" onClick={onStartAnother} className="mt-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        {dict.receipt.another}
      </GlassButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function IntakeForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { id: sessionId, renew } = useSessionId()
  // Never rendered, only sent, so generating it during render is safe.
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [receipt, setReceipt] = useState<PatientForm | null>(null)
  const { publish, connection } = usePatientPresence(sessionId)

  // Rebuilt per language: every message the patient reads has to be in theirs.
  const schema = useMemo(() => makePatientSchema(dict.validation, dict.form.fields), [dict])

  const methods = useForm<PatientForm>({
    resolver: zodResolver(schema),
    // Always empty here, never readDraft(): reading it during render gave the
    // client different values from the server and hydration failed on them.
    // The draft is applied just below, after mount.
    defaultValues: EMPTY_FORM,
    // IxDF inline validation: first check on blur, then live once touched, so
    // nobody is told they are wrong halfway through typing their own name.
    mode: 'onTouched',
  })

  // Restores a draft after hydration. reset() is an imperative form call, not a
  // React state update, so this stays out of the render path entirely.
  const { reset } = methods
  useEffect(() => {
    const draft = readDraft()
    if (FIELDS.some((field) => draft[field.name] !== '')) reset(draft, { keepDefaultValues: true })
  }, [reset])

  const onSubmit = methods.handleSubmit((values) => {
    // Published here rather than waiting on LiveMirror's debounce, which
    // unmounts on the very next render.
    publish({
      sessionId,
      data: values,
      submitted: true,
      filled: TOTAL_REQUIRED,
      total: TOTAL_REQUIRED,
      startedAt,
    })
    sessionStorage.removeItem(DRAFT_KEY)
    setReceipt(values)
  })

  const startAnother = () => {
    methods.reset(EMPTY_FORM)
    sessionStorage.removeItem(DRAFT_KEY)
    setReceipt(null)
    setStartedAt(Date.now())
    renew() // a new patient, not an edit of the last one
  }

  if (receipt) {
    return (
      <ThankYou
        values={receipt}
        reference={sessionId.slice(0, 8).toUpperCase()}
        dict={dict}
        locale={locale}
        onStartAnother={startAnother}
      />
    )
  }

  return (
    <FormProvider {...methods}>
      {/* Lives inside the form rather than the page so that submitting replaces
          it — "before you see the doctor" is wrong copy once they are done. */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{dict.form.heading}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/75">
          {/* Counted from the manifest so the promise cannot go stale. */}
          {fill(dict.form.intro, { total: FIELDS.length, optional: FIELDS.length - TOTAL_REQUIRED })}
        </p>
      </header>

      {!realtimeConfigured && <SetupNotice dict={dict} locale={locale} />}

      <form onSubmit={onSubmit} noValidate>
        {/* Sticky so the patient can always see how much is left, per IxDF's
            progress-indicator guidance, without a multi-step wizard. */}
        <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-brand-wash bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:top-20 sm:px-6 lg:mx-0 lg:px-0">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <LiveMirror sessionId={sessionId} startedAt={startedAt} publish={publish} dict={dict} />
            </div>
            <LiveIndicator connection={connection} dict={dict} />
          </div>
        </div>

        {FIELDS_BY_SECTION.map((section, index) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            // Read by SectionMedia, which watches these to decide which picture
            // to show. A data attribute rather than a callback prop: the media
            // panel is a sibling in the page, not a child of the form.
            data-intake-section={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="mb-6 scroll-mt-28 rounded-3xl border border-brand-wash bg-white p-5 shadow-card sm:p-7"
          >
            <div className="mb-6 flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-wash">
                <SectionIcon id={section.id} className="h-5 w-5" />
              </span>
              <div>
                <h2 id={`${section.id}-heading`} className="text-lg font-bold text-navy-900">
                  <span className="text-brand">{index + 1}.</span> {dict.form.sections[section.id].title}
                </h2>
                <p className="mt-1 text-sm text-muted">{dict.form.sections[section.id].blurb}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-6">
              {section.fields.map((field) => (
                <div key={field.name} className={SPAN_CLASS[field.span ?? 'full']}>
                  <Field def={field} dict={dict} locale={locale} />
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="space-y-4 rounded-3xl border border-brand-wash bg-white p-5 shadow-card sm:p-7">
          <ErrorSummary dict={dict} />

          {/* IxDF: put the privacy promise where the decision is made. */}
          <p className="flex gap-3 text-xs text-muted">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
              <path
                d="M10 2.5l6 2.2v5.1c0 3.5-2.4 6.7-6 7.7-3.6-1-6-4.2-6-7.7V4.7l6-2.2z"
                strokeWidth="1.5"
                className="stroke-brand"
              />
              <path d="M7.4 10.2l1.9 1.9 3.5-3.8" strokeWidth="1.5" strokeLinecap="round" className="stroke-brand" />
            </svg>
            <span>{dict.form.privacy}</span>
          </p>

          <Magnetic className="inline-flex w-full sm:w-auto">
            <GlassButton
              type="submit"
              disabled={methods.formState.isSubmitting}
              className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {dict.form.submit}
            </GlassButton>
          </Magnetic>
        </div>
      </form>
    </FormProvider>
  )
}
