'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthField } from './AuthField'
import { GlassButton } from './GlassButton'
import { SampleFill } from './SampleFill'
import { fill, type Dictionary, type Locale } from '@/i18n'
import { SAMPLE_STAFF, makeResetSchema, type ResetForm as Values } from '@/lib/auth'

/**
 * Password reset.
 *
 * The confirmation is worded the way a real one should be — "if an account uses
 * this address" — because saying "we sent it" for an address with no account
 * tells an attacker which of your staff emails are real. It then says outright
 * that nothing was sent, because in this demonstration nothing was.
 */
export function ResetForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState(false)

  const schema = useMemo(
    () =>
      makeResetSchema({
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
    defaultValues: { email: '' },
    mode: 'onTouched',
  })

  const backLink = (
    <Link
      href={`/${locale}/staff/login`}
      className="inline-flex min-h-11 items-center rounded px-1 font-semibold text-brand underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {dict.auth.reset.back}
    </Link>
  )

  if (sentTo) {
    return (
      <div className="mt-8">
        <div role="status" className="rounded-2xl border-2 border-state-ok/40 bg-white p-5">
          <p className="text-base font-bold text-state-ok">{dict.auth.reset.sentTitle}</p>
          <p className="mt-2 text-sm text-ink/80">
            {fill(dict.auth.reset.sentBody, { email: sentTo })}
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-muted">{backLink}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit((values) => setSentTo(values.email.trim()))}
      noValidate
      className="mt-8 space-y-5"
    >
      <AuthField
        {...register('email')}
        label={dict.auth.email}
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        dict={dict}
        delayMs={380}
      />

      <SampleFill
        checked={prefilled}
        onChange={(on) => {
          setPrefilled(on)
          setValue('email', on ? SAMPLE_STAFF.email : '', { shouldValidate: on })
        }}
        hint={SAMPLE_STAFF.email}
        dict={dict}
        delayMs={440}
      />

      <div className="enter" style={{ ['--enter-delay' as string]: '500ms' }}>
        <GlassButton type="submit" disabled={isSubmitting} className="w-full">
          {dict.auth.reset.submit}
        </GlassButton>
      </div>

      <p
        className="enter text-center text-sm text-muted"
        style={{ ['--enter-delay' as string]: '560ms' }}
      >
        {backLink}
      </p>
    </form>
  )
}
