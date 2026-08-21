'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthField } from './AuthField'
import { GlassButton } from './GlassButton'
import { SampleFill } from './SampleFill'
import type { Dictionary, Locale } from '@/i18n'
import {
  SAMPLE_STAFF,
  credentialsMatch,
  makeLoginSchema,
  writeStaffSession,
  type LoginForm as Values,
} from '@/lib/auth'

/**
 * Sign in. Validation is real, the credential check is against the sample
 * account, and the session it writes is the one the desk view reads.
 */
export function LoginForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const router = useRouter()
  const [rejected, setRejected] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  // Rebuilt per language so a switch mid-form re-renders the errors in the new
  // one rather than leaving the old language on screen.
  const schema = useMemo(
    () =>
      makeLoginSchema({
        required: dict.validation.fieldRequired,
        emailInvalid: dict.validation.emailInvalid,
        passwordShort: dict.validation.passwordShort,
        passwordMismatch: dict.validation.passwordMismatch,
        inviteInvalid: dict.validation.inviteInvalid,
        wrongCredentials: dict.auth.wrongCredentials,
      }),
    [dict],
  )

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
    mode: 'onTouched',
  })

  const applySample = (on: boolean) => {
    setPrefilled(on)
    setRejected(false)
    setValue('email', on ? SAMPLE_STAFF.email : '', { shouldValidate: on })
    setValue('password', on ? SAMPLE_STAFF.password : '', { shouldValidate: on })
  }

  const onSubmit = handleSubmit((values) => {
    if (!credentialsMatch(values.email, values.password)) {
      setRejected(true)
      return
    }
    writeStaffSession({ name: SAMPLE_STAFF.name, email: SAMPLE_STAFF.email }, values.remember)
    router.push(`/${locale}/staff`)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      <AuthField
        {...register('email')}
        label={dict.auth.email}
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        dict={dict}
        delayMs={380}
      />

      <AuthField
        {...register('password')}
        label={dict.auth.password}
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        dict={dict}
        delayMs={440}
      />

      <SampleFill
        checked={prefilled}
        onChange={applySample}
        hint={`${SAMPLE_STAFF.email} · ${SAMPLE_STAFF.password}`}
        dict={dict}
        delayMs={500}
      />

      <div
        className="enter flex flex-wrap items-center justify-between gap-3 text-sm"
        style={{ ['--enter-delay' as string]: '560ms' }}
      >
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            {...register('remember')}
            className="h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-line accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          <span className="text-ink/90">{dict.auth.login.remember}</span>
        </label>
        <Link
          href={`/${locale}/staff/reset`}
          className="inline-flex min-h-11 items-center rounded px-1 font-semibold text-brand underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {dict.auth.login.forgot}
        </Link>
      </div>

      {/* role="alert" so it is announced when it appears — a rejected sign in is
          the one thing on this page somebody needs told rather than shown. */}
      {rejected && (
        <p
          role="alert"
          className="rounded-xl border-2 border-state-error bg-white px-4 py-3 text-sm font-semibold text-state-error"
        >
          {dict.auth.wrongCredentials}
        </p>
      )}

      <div className="enter" style={{ ['--enter-delay' as string]: '620ms' }}>
        <GlassButton type="submit" disabled={isSubmitting} className="w-full">
          {dict.auth.login.submit}
        </GlassButton>
      </div>

      <p
        className="enter text-center text-sm text-muted"
        style={{ ['--enter-delay' as string]: '680ms' }}
      >
        {dict.auth.login.noAccount}{' '}
        <Link
          href={`/${locale}/staff/register`}
          className="rounded font-semibold text-brand underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {dict.auth.login.createOne}
        </Link>
      </p>
    </form>
  )
}
